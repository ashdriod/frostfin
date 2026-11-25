// Fictional library for the demo and screenshots. Every title, summary and
// image is made up; artwork is drawn by demo/art.mjs.
const MIN = 600000000; // Jellyfin ticks per minute

let n = 0;
const id = () => 'd0c0ffee' + String(++n).padStart(24, '0');

function movie(o) {
  const Id = id();
  return {
    Id, ServerId: 'demo', Type: 'Movie', MediaType: 'Video',
    ImageTags: { Primary: 'p' + Id.slice(-4), Logo: 'l' + Id.slice(-4), Thumb: 't' + Id.slice(-4) },
    BackdropImageTags: ['b' + Id.slice(-4)],
    ...o,
    RunTimeTicks: o.minutes * MIN,
    UserData: {
      PlaybackPositionTicks: Math.round((o.watched || 0) * o.minutes * MIN),
      PlayedPercentage: (o.watched || 0) * 100,
      IsFavorite: !!o.favorite, Played: false,
    },
  };
}

export const MOVIES = [
  movie({ Name: 'The Glass Meridian', ProductionYear: 2025, Genres: ['Drama', 'Mystery'], minutes: 134, OfficialRating: 'PG-13', watched: 0.46, scene: 'aurora',
    Overview: 'A cartographer charting the last unmapped stretch of the Arctic coast finds her maps redrawn every morning, in her own handwriting.',
    logo: { text: 'The Glass\nMeridian', font: 'Didot, "Bodoni 72", Georgia, serif', weight: 400, tracking: 0.14, glyph: 0.6, leading: 1.05 } }),
  movie({ Name: 'Neon Tide', ProductionYear: 2026, Genres: ['Sci-Fi', 'Thriller'], minutes: 118, OfficialRating: 'R', watched: 0.71, scene: 'city',
    Overview: 'When the sea wall fails, a night-shift engineer has one night to restart the city’s pumps and outrun the people who broke them.',
    logo: { font: 'Futura, "Avenir Next Condensed", "Arial Narrow", sans-serif', weight: 800, tracking: 0.22, fill: ['#ffffff', '#ff9ccd'] } }),
  movie({ Name: 'Ember Valley', ProductionYear: 2023, Genres: ['Western', 'Drama'], minutes: 141, OfficialRating: 'PG-13', watched: 0.22, scene: 'desert',
    Overview: 'Two estranged sisters drive a failing herd across a valley that has been on fire for forty years.',
    logo: { font: 'Rockwell, "Courier New", serif', weight: 700, tracking: 0.12, fill: ['#fff4dc', '#f2b36b'] } }),
  movie({ Name: 'Orbit of Ash', ProductionYear: 2026, Genres: ['Sci-Fi', 'Adventure'], minutes: 152, OfficialRating: 'PG-13', watched: 0.55, scene: 'space',
    Overview: 'The last crew of a mining station is offered a ride home, if they can agree on who stays behind.',
    logo: { font: '"Avenir Next", "Helvetica Neue", Arial, sans-serif', weight: 300, tracking: 0.42, glyph: 0.62 } }),
  movie({ Name: 'Kestrel Peak', ProductionYear: 2024, Genres: ['Adventure'], minutes: 109, OfficialRating: 'PG', scene: 'mountains',
    Overview: 'A retired mountain guide agrees to one last climb with a teenager who has never seen snow.',
    logo: { font: 'Optima, Candara, sans-serif', weight: 700, tracking: 0.16, glyph: 0.62 } }),
  movie({ Name: 'Saltwater Kings', ProductionYear: 2024, Genres: ['Comedy', 'Adventure'], minutes: 104, OfficialRating: 'PG', scene: 'ocean', favorite: true,
    Overview: 'Three fishermen bet their boats on a treasure map drawn on the back of a restaurant menu.',
    logo: { text: 'Saltwater\nKings', font: '"Bodoni 72", Didot, Georgia, serif', weight: 700, italic: true, tracking: 0.04, glyph: 0.6, leading: 0.95, fill: ['#ffffff', '#ffe0b0'] } }),
  movie({ Name: 'Hollow Pines', ProductionYear: 2025, Genres: ['Mystery', 'Horror'], minutes: 97, OfficialRating: 'R', scene: 'forest',
    Overview: 'A small-town radio host starts receiving calls from listeners who went missing in the woods decades ago.',
    logo: { font: 'Copperplate, "Copperplate Gothic Light", Georgia, serif', weight: 600, tracking: 0.2, glyph: 0.66, fill: ['#eef4ee', '#a9c2b4'] } }),
  movie({ Name: 'Velvet Hour', ProductionYear: 2022, Genres: ['Romance', 'Drama'], minutes: 112, OfficialRating: 'PG-13', scene: 'mountains',
    Overview: 'Every evening at dusk, a lighthouse keeper and a ferry pilot trade one letter across the bay.',
    logo: { font: 'Baskerville, "Times New Roman", serif', weight: 400, italic: true, tracking: 0.06, glyph: 0.58 } }),
  movie({ Name: 'The Quiet Year', ProductionYear: 2023, Genres: ['Drama'], minutes: 126, OfficialRating: 'PG', scene: 'forest',
    Overview: 'A composer who has lost her hearing spends a year rebuilding her grandfather’s mill and learning to listen again.',
    logo: { font: '"Gill Sans", "Trebuchet MS", sans-serif', weight: 300, tracking: 0.3, glyph: 0.6 } }),
  movie({ Name: 'Paper Moons', ProductionYear: 2021, Genres: ['Comedy', 'Family'], minutes: 95, OfficialRating: 'G', scene: 'aurora',
    Overview: 'A stubborn eight-year-old builds a rocket from cereal boxes and is absolutely certain it will work.',
    logo: { font: '"Avenir Next", "Helvetica Neue", Arial, sans-serif', weight: 800, tracking: 0.06, glyph: 0.66, fill: ['#ffffff', '#c8e9ff'] } }),
];

// A series, with one in-progress episode for Continue Watching
const seriesId = id();
export const SERIES = [
  { Id: seriesId, ServerId: 'demo', Type: 'Series', Name: 'Harbor Lights', ProductionYear: 2024, Genres: ['Drama', 'Crime'], OfficialRating: 'TV-14',
    ImageTags: { Primary: 'p1', Logo: 'l1', Thumb: 't1' }, BackdropImageTags: ['b1'], UserData: {}, scene: 'harbor',
    Overview: 'In a fishing town where everyone owes someone, the new harbor master finds out exactly who owes what.',
    logo: { text: 'Harbor\nLights', font: 'Didot, "Bodoni 72", Georgia, serif', weight: 700, tracking: 0.18, glyph: 0.62, leading: 1.0, fill: ['#ffffff', '#ffe6b5'] } },
  { Id: id(), ServerId: 'demo', Type: 'Series', Name: 'Undertow', ProductionYear: 2025, Genres: ['Thriller'], OfficialRating: 'TV-MA',
    ImageTags: { Primary: 'p2', Logo: 'l2' }, BackdropImageTags: ['b2'], UserData: {}, scene: 'ocean',
    Overview: 'A rescue diver keeps finding the same wristwatch on every body she brings up.',
    logo: { font: 'Futura, "Avenir Next", Arial, sans-serif', weight: 800, tracking: 0.3 } },
  { Id: id(), ServerId: 'demo', Type: 'Series', Name: 'Small Hours', ProductionYear: 2023, Genres: ['Comedy'], OfficialRating: 'TV-PG',
    ImageTags: { Primary: 'p3', Logo: 'l3' }, BackdropImageTags: ['b3'], UserData: {}, scene: 'city',
    Overview: 'The night staff of a 24-hour diner handle everything the day shift pretends not to see.',
    logo: { font: '"Avenir Next", Arial, sans-serif', weight: 700, tracking: 0.12 } },
  { Id: id(), ServerId: 'demo', Type: 'Series', Name: 'Dune Sea', ProductionYear: 2026, Genres: ['Documentary'], OfficialRating: 'TV-G',
    ImageTags: { Primary: 'p4', Logo: 'l4' }, BackdropImageTags: ['b4'], UserData: {}, scene: 'desert',
    Overview: 'A year in the life of the world’s largest moving desert, filmed from the ground up.',
    logo: { font: 'Optima, sans-serif', weight: 600, tracking: 0.3 } },
];

const ep = movie({ Name: 'The Lantern Keeper', minutes: 52, watched: 0.34, scene: 'harbor',
  Overview: 'A storm cuts the town off from the mainland, and the harbor master has to decide whose boat goes out first.' });
Object.assign(ep, {
  Type: 'Episode', SeriesName: 'Harbor Lights', SeriesId: seriesId, ParentIndexNumber: 2, IndexNumber: 4, ProductionYear: 2025,
  Genres: ['Drama', 'Crime'], OfficialRating: 'TV-14',
  ImageTags: { Primary: ep.ImageTags.Primary, Thumb: ep.ImageTags.Thumb },
  ParentLogoItemId: seriesId, ParentLogoImageTag: 'l1',
  ParentBackdropItemId: seriesId, ParentBackdropImageTags: ['b1'],
  logo: SERIES[0].logo,
});
export const EPISODES = [ep];

export const ALL = [...MOVIES, ...SERIES, ...EPISODES];
export const BY_ID = Object.fromEntries(ALL.map((i) => [i.Id, i]));

const m = (name) => MOVIES.find((x) => x.Name === name);
export const HOME = {
  continueWatching: [m('The Glass Meridian'), ep, m('Neon Tide'), m('Orbit of Ash'), m('Ember Valley')],
  recentMovies: MOVIES,
  recentShows: SERIES,
};
