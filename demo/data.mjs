// Demo library: the Blender Foundation's open movies. Their posters, artwork
// and title logos are licensed CC BY (see demo/media/SOURCES.md), so they can
// be shown and shipped here. Summaries are written for this demo.
const MIN = 600000000; // Jellyfin ticks per minute

let n = 0;
const id = () => 'b1e4de4f' + String(++n).padStart(24, '0');

function film(o) {
  const Id = id();
  const hasPoster = o.poster !== false;
  return {
    Id, ServerId: 'demo', Type: 'Movie', MediaType: 'Video',
    ImageTags: { ...(hasPoster && { Primary: 'p' + n }), Logo: 'l' + n, Thumb: 't' + n },
    BackdropImageTags: ['b' + n],
    ...o,
    RunTimeTicks: o.minutes * MIN,
    UserData: {
      PlaybackPositionTicks: Math.round((o.watched || 0) * o.minutes * MIN),
      PlayedPercentage: (o.watched || 0) * 100,
      IsFavorite: !!o.favorite, Played: false,
    },
  };
}

export const FILMS = [
  film({ slug: 'sintel', Name: 'Sintel', ProductionYear: 2010, Genres: ['Fantasy', 'Adventure'], minutes: 15, watched: 0.42,
    Overview: 'A lone traveller crosses mountains, deserts and snowfields to find the baby dragon she once rescued and lost.' }),
  film({ slug: 'sprite-fright', Name: 'Sprite Fright', ProductionYear: 2021, Genres: ['Horror', 'Comedy'], minutes: 11, watched: 0.63,
    Overview: 'A group of rowdy teenagers on a woodland trip discovers that the tiny forest sprites are not as friendly as they look.' }),
  film({ slug: 'charge', Name: 'Charge', ProductionYear: 2022, Genres: ['Sci-Fi', 'Action'], minutes: 4, watched: 0.35,
    Overview: 'In a frozen, ruined future, an old man fights a relentless security robot over the last source of power.' }),
  film({ slug: 'spring', Name: 'Spring', ProductionYear: 2019, Genres: ['Fantasy'], minutes: 8, watched: 0.2,
    Overview: 'A shepherd girl and her dog face the ancient spirits of the mountain to bring the season back.' }),
  film({ slug: 'cosmos-laundromat', Name: 'Cosmos Laundromat', ProductionYear: 2015, Genres: ['Fantasy', 'Comedy'], minutes: 12, watched: 0.55,
    Overview: 'On a desolate island, a despondent sheep named Franck meets a mysterious salesman who offers him any life he wants.' }),
  film({ slug: 'tears-of-steel', Name: 'Tears of Steel', ProductionYear: 2012, Genres: ['Sci-Fi'], minutes: 12, favorite: true,
    Overview: 'In a future Amsterdam overrun by robots, a group of scientists tries to save the world by revisiting a breakup.' }),
  film({ slug: 'elephants-dream', Name: 'Elephants Dream', ProductionYear: 2006, Genres: ['Sci-Fi', 'Drama'], minutes: 11,
    Overview: 'Two men explore an endless, shifting machine, each convinced he knows what it really is.' }),
  film({ slug: 'big-buck-bunny', Name: 'Big Buck Bunny', ProductionYear: 2008, Genres: ['Comedy', 'Family'], minutes: 10,
    Overview: 'A gentle giant rabbit has had enough of three bullying rodents and plans a very elaborate revenge.' }),
  film({ slug: 'wing-it', Name: 'Wing It!', ProductionYear: 2023, Genres: ['Comedy'], minutes: 4, poster: false,
    Overview: 'A cat and a dog build a rocket out of farm junk. What could possibly go wrong?' }),
  film({ slug: 'coffee-run', Name: 'Coffee Run', ProductionYear: 2020, Genres: ['Drama'], minutes: 3, poster: false,
    Overview: 'Running on caffeine, a young woman races through the memories of a fading relationship.' }),
  film({ slug: 'caminandes-3', Name: 'Caminandes: Llamigos', ProductionYear: 2016, Genres: ['Comedy', 'Family'], minutes: 3, poster: false,
    Overview: 'Koro the llama and a hungry penguin compete for the last berries of a Patagonian winter.' }),
  film({ slug: 'agent-327', Name: 'Agent 327: Operation Barbershop', ProductionYear: 2017, Genres: ['Action', 'Comedy'], minutes: 4, poster: false,
    Overview: 'A secret agent goes undercover in a barbershop that is hiding far more than hair clippers.' }),
];

export const BY_ID = Object.fromEntries(FILMS.map((i) => [i.Id, i]));

const f = (slug) => FILMS.find((x) => x.slug === slug);
export const HOME = {
  continueWatching: ['sintel', 'sprite-fright', 'charge', 'cosmos-laundromat', 'spring'].map(f),
  recentMovies: FILMS.filter((x) => x.ImageTags.Primary),
  recentShorts: ['wing-it', 'coffee-run', 'caminandes-3', 'agent-327', 'tears-of-steel'].map(f),
};
