const adom = require('adom-js');

const prod = !process.argv.includes('dev');

const mapStories = {
  top: "news",
  new: "newest",
  show: "show",
  ask: "ask",
  job: "jobs",
};

async function storiesHandler(req) {
  const page = parseInt(req.query.page || '1');
  const type = mapStories[req.params.type || 'top'];
  if (!type) return null;
  const stories = await adom.request(`https://api.hackerwebapp.com/${type}?page=${page}`);
  return { stories, page, type: req.params.type || 'top' };
}

async function storyHandler(req) {
  const id = req.params.id;
  const story = await adom.request(`https://api.hackerwebapp.com/item/${id}`);
  return { story };
}

async function userHandler(req) {
  const id = req.params.id;
  const user = await adom.request(`https://hacker-news.firebaseio.com/v0/user/${id}.json`);
  return { user };
}

adom.serve({
  publicDir: './public',
  cache: prod,
  minify: prod,
  stream: true,
  routes: {
    '/': {
      input: './src/stories.adom',
      data: storiesHandler
    },
    '/:type': {
      input: './src/stories.adom',
      data: storiesHandler
    },
    '/item/:id': {
      input: './src/story.adom',
      data: storyHandler
    },
    '/users/:id': {
      input: './src/user.adom',
      data: userHandler
    }
  },
});
