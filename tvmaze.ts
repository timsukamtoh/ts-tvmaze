import axios from "axios";
import * as $ from 'jquery';

const $showsList = $("#showsList");
const $episodesArea = $("#episodesArea");
const $episodesList = $("#episodesList");
const $searchForm = $("#searchForm");

const BASE_URL = "https://api.tvmaze.com";
const DEFAULT_IMG = 'https://tinyurl.com/tv-missing';

interface ShowInterface {
  id: number;
  name: string;
  summary: string;
  imgSrc: string;
}

interface ShowApiResultInterface {
  id: number,
  name: string,
  summary: string,
  image: { medium: string | null; };
}

/** Given a search term, search for tv shows that match that query.
 *
 *  Returns (promise) array of show objects: [show, show, ...].
 *    Each show object should contain exactly: {id, name, summary, image}
 *    (if no image URL given by API, put in a default image URL)
 */

async function getShowsByTerm(term: string): Promise<ShowInterface[]> {

  const showsResults = await axios({
    method: 'get',
    baseURL: BASE_URL,
    url: '/search/shows',
    params: {
      q: term,
    }
  });

  const shows: ShowInterface[] = showsResults.data.map((result:
    { show: ShowApiResultInterface }) => {
    const { id, name, summary, image } = result.show;
    const imgSrc = image === null ? DEFAULT_IMG : image.medium;  // url to global

    return { id, name, summary, imgSrc };
  });

  return shows;
}


/** Given list of shows, create markup for each and to DOM */

function populateShows(shows: ShowInterface[]): void {
  $showsList.empty();

  for (let { id, name, summary, imgSrc } of shows) {
    const $show = $(
      `<div data-show-id="${id}" class="Show col-md-12 col-lg-6 mb-4">
         <div class="media">
           <img
              src=${imgSrc}
              alt=${name}
              class="w-25 me-3">
           <div class="media-body">
             <h5 class="text-primary">${name}</h5>
             <div><small>${summary}</small></div>
             <button class="btn btn-outline-light btn-sm Show-getEpisodes">
               Episodes
             </button>
           </div>
         </div>
       </div>
      `);
    $showsList.append($show);
  }
}


/** Handle search form submission: get shows from API and display.
 *    Hide episodes area (that only gets shown if they ask for episodes)
 */

async function searchForShowAndDisplay(): Promise<void> {
  const term = $("#searchForm-term").val() as string;
  const shows = await getShowsByTerm(term);

  $episodesArea.hide();
  populateShows(shows);
}

$searchForm.on("submit", async function (evt) {
  evt.preventDefault();
  await searchForShowAndDisplay();
});

interface EpisodeInterface {
  id: number;
  name: string;
  season: number;
  number: number;
}

/** Given a show ID, get from API and return (promise) array of episodes:
 *      { id, name, season, number }
 */

async function getEpisodesOfShow(id: number): Promise<EpisodeInterface[]> {
  const episodeResults = await axios.get<EpisodeInterface[]>( `${BASE_URL}/shows/${id}/episodes`);

  const episodeList:EpisodeInterface[] = episodeResults.data.map(function (episode: EpisodeInterface) {
    const { id, name, season, number } = episode;
    return { id, name, season, number };
  });

  return episodeList;
}

/**
 * Takes in a list of episodes and appends each episode to the DOM as li elements
 * @param {EpisodeInterface[]} episodes
 */
function populateEpisodes(episodes: EpisodeInterface[]): void {
  $episodesList.empty();

  for (const { name, season, number } of Array.from(episodes)) {
    $episodesList.append(`<li>${name} (season ${season}, number ${number})</li>`);
  }
}

/**
 * Finds the show id and gets the data for the episodes and displays it
 */
async function getEpisodesAndDisplay(evt:JQuery.ClickEvent): Promise<void> {
  const showId = $(evt.target).closest(".Show").data("show-id");

  const episodes = await getEpisodesOfShow(showId);

  populateEpisodes(episodes);
  $episodesArea.show();
}


$showsList.on("click", ".Show-getEpisodes", getEpisodesAndDisplay);