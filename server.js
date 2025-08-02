import light from '@cilix/lightjs';
import http from 'http';
import fetch from 'node-fetch';

const port = 5000;

const prod = !process.argv.includes('dev');

const baseUrl = 'https://hacker-news.firebaseio.com/v0';

const mapStories = {
  ask: 'askstories',
  job: 'jobstories',
  show: 'showstories',
  new: 'topstories',
  top: 'topstories'
};

async function getJson(uri) {
  const res = await fetch(uri);
  if (res.ok) {
    return await res.json();
  } else {
    return null;
  }
}

async function fetchItem(id, withComments) {
  const item = await getJson(`${baseUrl}/item/${id}.json`);
  const children = item.kids || {};
  return {
    id: item.id,
    user: item.by,
    points: item.score,
    time: item.time,
    content: item.text,
    url: item.url,
    type: item.type,
    title: item.title,
    comments_count: Object.values(children).length,
    comments: withComments
      ? await Promise.all(Object.values(children).map(id =>
          fetchItem(id, withComments),
        ))
      : []
  }
}

async function storiesHandler(req) {
  const page = parseInt(req.query.page || '1');
  const type = mapStories[req.params.type || 'top'];
  if (!type) return {};
  const stories = (await getJson(`${baseUrl}/${type}.json`)) || [];
  const paged = stories.splice((page-1)*10, 10);
  const resolved = await Promise.all(
    paged.map(async (id) => fetchItem(id, false))
  );
  return { stories: resolved, page, type: req.params.type || 'top' };
}

async function storyHandler(req) {
  const id = req.params.id;
  const story = await fetchItem(id, true);
  return { story };
}

async function userHandler(req) {
  const id = req.params.id;
  const user = await getJson(`${baseUrl}/user/${id}.json`);
  return { user };
}

const app = light.router({
  publicDir: './public',
  cache: prod,
  minify: prod,
  // stream: prod,
  routes: {
    '/': {
      input: './src/stories.light',
      data: storiesHandler
    },
    '/:type': {
      input: './src/stories.light',
      data: storiesHandler
    },
    '/item/:id': {
      input: './src/story.light',
      data: storyHandler
    },
    '/users/:id': {
      input: './src/user.light',
      data: userHandler
    }
  },
});

http.createServer(app).listen(port, () => {
  console.log(`Listening on port ${port}`);
});
