/* Frostfin: companion script.
   Load it server-wide with the JavaScript Injector plugin (see README).
   theme.css works without it; this adds what CSS can't do, on Home only:

   1. Featured hero: a hero above the rows with the featured item's title logo,
      year · genres · runtime, summary, and Resume / Favorite / Info
      buttons. It follows the card you hover or focus (after a short dwell)
      and starts on your first Continue Watching item.
   2. Ambient backdrop: that item's artwork fills the top of the page and
      melts into black.
   3. Continue Watching tiles: sharp artwork (requested at the size it's
      shown, not Jellyfin's smaller default) and the title logo on the art.
   4. Row links ("Recently Added in Movies › See All") open the full
      library list instead of the Suggestions tab.

   Skips the hero when the Editor's Choice plugin already provides one.
   Off while a video is playing. Text from the server is set with
   textContent, never parsed as HTML. */
(function () {
    'use strict';
    if (window.__frostfinLoaded) return;
    window.__frostfinLoaded = true;

    var root = document.documentElement;
    var DWELL = 280;              // ms a card must stay hovered/focused
    var RESUME_ROW = '.itemsContainer[data-monitor^="videoplayback"]';
    var layer, imgs, front = 0, currentBg = '', featuredId = '';
    var dwellTimer = 0, scanTimer = 0;
    var itemCache = Object.create(null);

    /* ---------- helpers ---------- */

    function api() { return window.ApiClient; }

    function base() {
        try { return api().serverAddress().replace(/\/$/, ''); } catch (e) { return ''; }
    }

    function imageUrl(id, type, tag, params) {
        var q = [];
        if (tag) q.push('tag=' + encodeURIComponent(tag));
        for (var k in params) q.push(encodeURIComponent(k) + '=' + encodeURIComponent(params[k]));
        return base() + '/Items/' + encodeURIComponent(id) + '/Images/' + type + (type === 'Backdrop' ? '/0' : '') + '?' + q.join('&');
    }

    // CSS-safe url("...") value: ids and tags come from the server
    function cssUrl(u) {
        return 'url("' + String(u).replace(/["\\\n\r]/g, function (c) {
            return '%' + c.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0');
        }) + '")';
    }

    // Selector for a card by item id, safe for any id string
    function cardSel(id) {
        var v = window.CSS && CSS.escape ? CSS.escape(id) : String(id).replace(/[^\w-]/g, '');
        return '.homeSectionsContainer .card[data-id="' + v + '"]';
    }

    function getItem(id) {
        var c = api();
        if (!c || !c.getItem) return Promise.reject(new Error('ApiClient not ready'));
        if (!itemCache[id]) {
            itemCache[id] = Promise.resolve(c.getItem(c.getCurrentUserId(), id)).catch(function (e) {
                delete itemCache[id];
                throw e;
            });
        }
        return itemCache[id];
    }

    function el(tag, cls, text) {
        var e = document.createElement(tag);
        if (cls) e.className = cls;
        if (text != null) e.textContent = text;
        return e;
    }

    function icon(name) {
        var s = el('span', 'material-icons ' + name);
        s.setAttribute('aria-hidden', 'true');
        return s;
    }

    function px() {
        return Math.min(3840, Math.round(screen.width * (window.devicePixelRatio || 1)));
    }

    function logoOf(it) {
        if (it.ImageTags && it.ImageTags.Logo) return { id: it.Id, tag: it.ImageTags.Logo };
        if (it.ParentLogoItemId) return { id: it.ParentLogoItemId, tag: it.ParentLogoImageTag };
        return null;
    }

    function backdropOf(it) {
        if (it.BackdropImageTags && it.BackdropImageTags.length) return { id: it.Id, tag: it.BackdropImageTags[0] };
        if (it.ParentBackdropItemId && it.ParentBackdropImageTags && it.ParentBackdropImageTags.length) {
            return { id: it.ParentBackdropItemId, tag: it.ParentBackdropImageTags[0] };
        }
        return null;
    }

    function runtime(ticks) {
        var m = Math.round(ticks / 600000000);
        if (!m) return '';
        return m >= 60 ? Math.floor(m / 60) + 'h ' + (m % 60 ? (m % 60) + 'm' : '') : m + 'm';
    }

    function goDetails(it) {
        var sid = it.ServerId || (api() && api().serverId ? api().serverId() : '');
        location.hash = '#/details?id=' + encodeURIComponent(it.Id) + '&serverId=' + encodeURIComponent(sid);
    }

    /* ---------- 4. Row links go to the whole library ---------- */

    function fixLinks(scope) {
        var links = (scope || document).querySelectorAll('a.sectionTitleTextButton[href*="tab=1"]');
        for (var i = 0; i < links.length; i++) {
            var h = links[i].getAttribute('href');
            if (/topParentId=/.test(h) && links[i].closest('.homeSectionsContainer')) {
                links[i].setAttribute('href', h.replace('tab=1', 'tab=0'));
            }
        }
    }

    root.style.setProperty('--frost-more-label', '"See All \\203A"');

    document.addEventListener('pointerdown', function (e) {
        var a = e.target.closest && e.target.closest('a.sectionTitleTextButton');
        if (a) fixLinks(a.parentNode);
    }, true);

    /* ---------- 2. Ambient backdrop ---------- */

    function ensureLayer() {
        if (layer && layer.isConnected) return;
        layer = el('div', 'frostAmbient');
        layer.setAttribute('aria-hidden', 'true');
        layer.appendChild(el('div', 'frostAmbient-img'));
        layer.appendChild(el('div', 'frostAmbient-img'));
        layer.appendChild(el('div', 'frostAmbient-scrim'));
        document.body.appendChild(layer);
        imgs = layer.querySelectorAll('.frostAmbient-img');
    }

    function showBackdrop(url) {
        if (!url || url === currentBg) return;
        currentBg = url;
        var probe = new Image();
        probe.onload = function () {
            if (url !== currentBg) return;
            ensureLayer();
            var back = imgs[1 - front];
            back.style.backgroundImage = cssUrl(url);
            back.classList.add('is-visible');
            imgs[front].classList.remove('is-visible');
            front = 1 - front;
        };
        probe.src = url;
    }

    /* ---------- 1. Featured hero ---------- */

    function heroFor(home) {
        if (home.querySelector('.editorsChoiceContainer')) return null;
        var h = home.querySelector(':scope > .frostHero');
        if (!h) {
            h = el('div', 'frostHero padded-left padded-right');
            h.appendChild(el('div', 'frostHero-inner'));
            home.insertBefore(h, home.firstChild);
        }
        return h;
    }

    function renderHero(hero, it) {
        var inner = el('div', 'frostHero-inner');
        var name = it.Type === 'Episode' && it.SeriesName ? it.SeriesName : it.Name;

        var logo = logoOf(it);
        var title = el('h1', 'frostHero-title', name);
        if (logo) {
            var img = el('img', 'frostHero-logo');
            img.alt = name;
            img.onerror = function () { img.replaceWith(title); };
            img.src = imageUrl(logo.id, 'Logo', logo.tag, { maxWidth: 800, quality: 90 });
            inner.appendChild(img);
        } else {
            inner.appendChild(title);
        }

        var meta = el('div', 'frostHero-meta');
        if (it.Type === 'Episode') {
            var se = (it.ParentIndexNumber != null ? 'S' + it.ParentIndexNumber + ' ' : '') + (it.IndexNumber != null ? 'E' + it.IndexNumber : '');
            if (se.trim()) meta.appendChild(el('span', '', se.trim()));
            if (it.Name) meta.appendChild(el('span', '', it.Name));
        } else if (it.ProductionYear) {
            meta.appendChild(el('span', '', String(it.ProductionYear)));
        }
        if (it.Genres && it.Genres.length) meta.appendChild(el('span', '', it.Genres.slice(0, 2).join(', ')));
        if (it.RunTimeTicks) meta.appendChild(el('span', '', runtime(it.RunTimeTicks)));
        if (it.OfficialRating) meta.appendChild(el('span', 'frostHero-rating', it.OfficialRating));
        if (meta.childNodes.length) inner.appendChild(meta);

        if (it.Overview) inner.appendChild(el('p', 'frostHero-overview', it.Overview));

        var ud = it.UserData || {};
        var resuming = ud.PlaybackPositionTicks > 0 && it.RunTimeTicks;
        var actions = el('div', 'frostHero-actions');

        var play = el('button', 'frostHero-play');
        play.type = 'button';
        play.appendChild(icon('play_arrow'));
        play.appendChild(el('span', '', resuming ? 'Resume' : 'Play'));
        play.addEventListener('click', function () {
            // Jellyfin's own play button on the matching card does the real work
            var btn = document.querySelector(cardSel(it.Id) + ' .cardOverlayFab-primary');
            if (btn) btn.click(); else goDetails(it);
        });
        actions.appendChild(play);

        var fav = el('button', 'frostHero-btn');
        fav.type = 'button';
        fav.title = 'Favorite';
        fav.setAttribute('aria-pressed', ud.IsFavorite ? 'true' : 'false');
        fav.appendChild(icon('favorite'));
        fav.addEventListener('click', function () {
            var on = fav.getAttribute('aria-pressed') !== 'true';
            fav.setAttribute('aria-pressed', on ? 'true' : 'false');
            var c = api();
            if (!c || !c.updateFavoriteStatus) { fav.setAttribute('aria-pressed', on ? 'false' : 'true'); return; }
            Promise.resolve(c.updateFavoriteStatus(c.getCurrentUserId(), it.Id, on)).then(function () {
                if (it.UserData) it.UserData.IsFavorite = on;
            }, function () {
                fav.setAttribute('aria-pressed', on ? 'false' : 'true');
            });
        });
        actions.appendChild(fav);

        var info = el('button', 'frostHero-btn');
        info.type = 'button';
        info.title = 'More info';
        info.appendChild(icon('info'));
        info.addEventListener('click', function () { goDetails(it); });
        actions.appendChild(info);
        inner.appendChild(actions);

        if (resuming) {
            var pct = Math.min(100, Math.round(ud.PlaybackPositionTicks / it.RunTimeTicks * 100));
            var prog = el('div', 'frostHero-progress');
            var bar = el('div', 'frostHero-bar');
            var fill = el('div', 'frostHero-barFill');
            fill.style.width = pct + '%';
            bar.appendChild(fill);
            prog.appendChild(bar);
            prog.appendChild(el('span', '', runtime(it.RunTimeTicks - ud.PlaybackPositionTicks) + ' left'));
            inner.appendChild(prog);
        }

        var old = hero.querySelector('.frostHero-inner');
        hero.classList.add('is-changing');
        setTimeout(function () {
            if (old && old.parentNode === hero) hero.replaceChild(inner, old); else hero.appendChild(inner);
            hero.classList.remove('is-changing');
        }, old && old.childNodes.length ? 180 : 0);
    }

    function feature(card) {
        var id = card && card.getAttribute('data-id');
        if (!id || id === featuredId) return;
        featuredId = id;
        getItem(id).then(function (it) {
            if (featuredId !== id) return;
            var bd = backdropOf(it);
            if (bd) showBackdrop(imageUrl(bd.id, 'Backdrop', bd.tag, { maxWidth: px(), quality: 85 }));
            var home = activeHome();
            var hero = home && heroFor(home);
            if (hero) renderHero(hero, it);
        }, function () { /* item gone or offline: keep what's shown */ });
    }

    /* ---------- 3. Continue Watching tiles ---------- */

    function upgradeTiles(home) {
        var cards = home.querySelectorAll(RESUME_ROW + ' .card[data-id]');
        for (var i = 0; i < cards.length; i++) {
            var card = cards[i];
            var box = card.querySelector('.cardImageContainer');
            // Sharp artwork: re-request at the rendered size
            if (box && !box.dataset.frostHires && /fillWidth=/.test(box.style.backgroundImage)) {
                var r = box.getBoundingClientRect();
                if (r.width > 0) {
                    var dpr = window.devicePixelRatio || 1;
                    var w = Math.ceil(r.width * dpr / 100) * 100;
                    var h = Math.round(w * r.height / r.width);
                    box.dataset.frostHires = '1';
                    var url = box.style.backgroundImage
                        .replace(/fillWidth=\d+/, 'fillWidth=' + w)
                        .replace(/fillHeight=\d+/, 'fillHeight=' + h)
                        .replace(/quality=\d+/, 'quality=90');
                    var probe = new Image();
                    probe.onload = (function (b, u) {
                        return function () { b.style.backgroundImage = u; };
                    })(box, url);
                    probe.src = url.replace(/^url\("?|"?\)$/g, '');
                }
            }
            // Title logo on the art
            if (!card.dataset.frostLogo) {
                card.dataset.frostLogo = 'pending';
                (function (c) {
                    getItem(c.getAttribute('data-id')).then(function (it) {
                        var logo = logoOf(it);
                        var sc = c.querySelector('.cardScalable');
                        if (!logo || !sc) { c.dataset.frostLogo = 'none'; return; }
                        var img = el('img', 'frostTileLogo');
                        img.alt = '';
                        img.onload = function () { c.classList.add('frostHasLogo'); };
                        img.onerror = function () { img.remove(); };
                        img.src = imageUrl(logo.id, 'Logo', logo.tag, { maxWidth: 600, quality: 90 });
                        sc.appendChild(img);
                        c.dataset.frostLogo = 'done';
                    }, function () { c.dataset.frostLogo = ''; });
                })(card);
            }
        }
    }

    /* ---------- page tracking ---------- */

    function activeHome() {
        if (document.querySelector('.videoPlayerContainer')) return null;
        var homes = document.querySelectorAll('.homeSectionsContainer');
        for (var i = 0; i < homes.length; i++) {
            var page = homes[i].closest('.page');
            if (homes[i].offsetParent !== null && (!page || !page.classList.contains('hide'))) return homes[i];
        }
        return null;
    }

    function firstCard(home) {
        return home.querySelector(RESUME_ROW + ' .card[data-id]') ||
               home.querySelector('.card[data-id]:not([data-type="CollectionFolder"]):not([data-type="UserView"])');
    }

    function scan() {
        scanTimer = 0;
        var home = activeHome();
        if (!home) {
            root.classList.remove('frost-ambient-on');
            return;
        }
        root.classList.add('frost-ambient-on');
        fixLinks(home);
        upgradeTiles(home);
        var hero = heroFor(home);
        if (!featuredId) {
            feature(firstCard(home));
        } else if (hero && !hero.querySelector('.frostHero-inner').childNodes.length) {
            // Jellyfin re-rendered Home: draw the featured item again
            var id = featuredId;
            featuredId = '';
            feature(document.querySelector(cardSel(id)) || firstCard(home));
        }
    }

    function scheduleScan() {
        if (!scanTimer) scanTimer = setTimeout(scan, 120);
    }

    function onCard(e) {
        if (!root.classList.contains('frost-ambient-on')) return;
        var card = e.target.closest && e.target.closest('.homeSectionsContainer .card[data-id]');
        if (!card) return;
        var t = card.getAttribute('data-type');
        if (t === 'CollectionFolder' || t === 'UserView') return;
        clearTimeout(dwellTimer);
        dwellTimer = setTimeout(function () { feature(card); }, DWELL);
    }

    document.addEventListener('mouseover', onCard, { passive: true });
    document.addEventListener('focusin', onCard);
    document.addEventListener('mouseout', function (e) {
        // Leaving a card before the dwell ends cancels the switch
        if (e.target.closest && e.target.closest('.card') && !(e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest('.card'))) {
            clearTimeout(dwellTimer);
        }
    }, { passive: true });
    window.addEventListener('hashchange', function () { featuredId = ''; currentBg = ''; scheduleScan(); });
    document.addEventListener('viewshow', scheduleScan);

    new MutationObserver(scheduleScan).observe(document.body, {
        childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style']
    });
    scheduleScan();
})();
