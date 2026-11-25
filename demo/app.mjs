// Renders the demo Home page with jellyfin-web 10.11's markup, installs a mock
// ApiClient backed by demo/data.mjs, then loads dist/theme.js exactly as the
// JavaScript Injector plugin would.
import { HOME, BY_ID } from './data.mjs';

const q = new URLSearchParams(location.search);
const layout = q.has('tv') ? 'tv' : q.has('mobile') ? 'mobile' : 'desktop';
document.documentElement.className = 'layout-' + layout;

const SERVER = location.origin + '/demo-server';
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const img = (id, type, tag, w, h) =>
  `${SERVER}/Items/${id}/Images/${type}?fillHeight=${h}&fillWidth=${w}&quality=96&tag=${tag}`;

// Icons used by the page and by theme.js
const ICONS = ['menu', 'group', 'cast', 'search', 'person', 'play_arrow', 'check', 'favorite', 'more_vert', 'info', 'chevron_right'];
const style = document.createElement('style');
style.textContent = ICONS.map((n) => `.material-icons.${n}::before{content:"${n}"}`).join('\n');
document.head.appendChild(style);

function overlay(it, resume) {
  return `<div class="cardOverlayContainer itemAction" data-action="link">
    <button is="paper-icon-button-light" class="cardOverlayButton cardOverlayButton-hover itemAction paper-icon-button-light cardOverlayFab-primary" data-action="${resume ? 'resume' : 'play'}" title="${resume ? 'Resume' : 'Play'}"><span class="material-icons cardOverlayButtonIcon cardOverlayButtonIcon-hover play_arrow" aria-hidden="true"></span></button>
    <div class="cardOverlayButton-br flex">
      <button is="emby-playstatebutton" type="button" class="cardOverlayButton cardOverlayButton-hover itemAction paper-icon-button-light emby-button" title="Mark played"><span class="material-icons cardOverlayButtonIcon cardOverlayButtonIcon-hover check" aria-hidden="true"></span></button>
      <button is="emby-ratingbutton" type="button" class="cardOverlayButton cardOverlayButton-hover itemAction paper-icon-button-light emby-button" title="Favorite"><span class="material-icons cardOverlayButtonIcon cardOverlayButtonIcon-hover favorite" aria-hidden="true"></span></button>
      <button is="paper-icon-button-light" class="cardOverlayButton cardOverlayButton-hover itemAction paper-icon-button-light" data-action="menu" title="More"><span class="material-icons cardOverlayButtonIcon cardOverlayButtonIcon-hover more_vert" aria-hidden="true"></span></button>
    </div></div>`;
}

function card(it, shape) {
  const backdrop = shape === 'overflowBackdrop';
  const resume = backdrop && it.UserData?.PlaybackPositionTicks > 0;
  const src = backdrop ? img(it.Id, 'Thumb', it.ImageTags.Thumb, 463, 261) : img(it.Id, 'Primary', it.ImageTags.Primary, 274, 411);
  const title = it.Name;
  const sub = it.ProductionYear;
  const progress = resume
    ? `<div class="innerCardFooter fullInnerCardFooter innerCardFooterClear"><div class="itemProgressBar"><div class="itemProgressBarForeground" style="width:${it.UserData.PlayedPercentage}%"></div></div></div>`
    : '';
  return `<div class="card ${shape}Card card-hoverable card-withuserdata" data-index="0" data-isfolder="false" data-serverid="demo" data-id="${esc(it.Id)}" data-type="${esc(it.Type)}" data-mediatype="Video" data-prefix="${esc(title[0])}" tabindex="0">
    <div class="cardBox cardBox-bottompadded">
      <div class="cardScalable">
        <div class="cardPadder cardPadder-${shape} lazy-hidden-children"></div>
        <a href="#/details?id=${esc(it.Id)}" data-action="link" class="cardImageContainer coveredImage cardContent itemAction lazy" aria-label="${esc(title)}" style="background-image: url(&quot;${esc(src)}&quot;);">${progress}</a>
        ${overlay(it, resume)}
      </div>
      <div class="cardText cardTextCentered cardText-first"><bdi><a href="#/details?id=${esc(it.Id)}" class="itemAction textActionButton" data-action="link" title="${esc(title)}">${esc(title)}</a></bdi></div>
      <div class="cardText cardTextCentered cardText-secondary"><bdi>${esc(sub)}</bdi></div>
    </div>
  </div>`;
}

function libraryCard(name, idx) {
  return `<div class="card overflowBackdropCard card-hoverable" data-id="lib${idx}" data-type="CollectionFolder" data-collectiontype="${name === 'Movies' ? 'movies' : 'tvshows'}" tabindex="0">
    <div class="cardBox cardBox-bottompadded"><div class="cardScalable"><div class="cardPadder cardPadder-overflowBackdrop"></div>
    <a class="cardImageContainer coveredImage cardContent itemAction" href="#"></a></div>
    <div class="cardText cardTextCentered cardText-first"><bdi>${name}</bdi></div></div></div>`;
}

function section(i, head, items, monitor) {
  return `<div class="verticalSection section${i}">
    ${head}
    <div is="emby-scroller" class="padded-top-focusscale padded-bottom-focusscale emby-scroller" data-centerfocus="true">
      <div is="emby-itemscontainer" class="itemsContainer scrollSlider focuscontainer-x animatedScrollX"${monitor ? ` data-monitor="${monitor}"` : ''}>${items}</div>
    </div></div>`;
}

const plainHead = (t) => `<h2 class="sectionTitle sectionTitle-cards padded-left">${t}</h2>`;
const linkHead = (t, type) => `<div class="sectionTitleContainer sectionTitleContainer-cards padded-left">
  <a is="emby-linkbutton" href="#/${type}?topParentId=lib${type === 'movies' ? 0 : 1}&amp;collectionType=${type}&amp;tab=1" class="more button-flat button-flat-mini sectionTitleTextButton emby-button">
    <h2 class="sectionTitle sectionTitle-cards">${t}</h2><span class="material-icons chevron_right" aria-hidden="true"></span></a></div>`;

document.getElementById('home').innerHTML = [
  section(0, plainHead('My Media'), ['Movies', 'Shorts'].map(libraryCard).join('')),
  section(1, plainHead('Continue Watching'), HOME.continueWatching.map((it) => card(it, 'overflowBackdrop')).join(''), 'videoplayback,markplayed'),
  section(2, linkHead('Recently Added in Movies', 'movies'), HOME.recentMovies.map((it) => card(it, 'overflowPortrait')).join('')),
  section(3, linkHead('Recently Added in Shorts', 'tvshows'), HOME.recentShorts.map((it) => card(it, 'overflowBackdrop')).join('')),
].join('');

// Mock of the parts of jellyfin-web's ApiClient that theme.js uses
window.ApiClient = {
  serverAddress: () => SERVER,
  serverId: () => 'demo',
  getCurrentUserId: () => 'demo-user',
  getItem: (_user, id) => BY_ID[id]
    ? new Promise((r) => setTimeout(() => r(structuredClone(BY_ID[id])), 40))
    : Promise.reject(new Error('404')),
  updateFavoriteStatus: (_user, id, on) => {
    if (BY_ID[id]) BY_ID[id].UserData.IsFavorite = on;
    return Promise.resolve({ IsFavorite: on });
  },
};

// Cards don't navigate in the demo
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#/"]');
  if (a && !a.classList.contains('sectionTitleTextButton')) e.preventDefault();
});

const s = document.createElement('script');
s.src = '../dist/theme.js';
document.body.appendChild(s);
