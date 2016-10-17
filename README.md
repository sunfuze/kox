# KOX

[![NPM version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]

koa module addon, make write api server more easier. Design an api style, combine with swagger(inspired by hapi-swagger).

## Installation

```
 $ npm i kox
```

## Example


```js
// this will return an koa instance, so all koa properties are supported by kox.
const app = require('kox')
const apis = [{
  method: 'get',
  path: '/',
  handler: function (ctx) {
    ctx.set('x-powered-by', 'kox')
    return "hello world"
  }
}]
app.loadApis(api)
app.listen(3838)
```

## Getting started
- [stores-example](https://github.com/sunfuze/kox/blob/master/example/README.md)

## API

### app
Because `kox` is just `koa` addon, so all koa app `api` are supported.
You can read [koa docs](https://github.com/koajs/koa/blob/master/docs/api/index.md).

In kox, i use `koa-body` to handle request body parsing, so you dont need to add this middleware again in your project, the default body parser setting as follow:  

```js
{
  jsonLimit: '100KB',
  formLimit: '50KB',
  multipart: true,
  formidable: {
  uploadDir: join(process.cwd(), 'runtime')
}
```

You can modify body parser setting when initial kox instance:

```js
const app = kox({bodyParser: {...}})
```

### Controller
Kox add two controller related api to koa instance:  
- `app.controller`
- `app.loadCtrls`



#### app.controller
This api is used to add an controller.

```js
const fooController = {name: 'foo', ...}
// this operation add controller to app._controllers, we will using these controllers in api definitions.
app.controller(fooController)
```

#### app.loadCtrls
This api is used to add multiple controllers. I usually use it with `require-dir` module. You can see code in example.

```js
const requireDir = require('require-dir')
const controllers = require('../controllers')
app.loadCtrls(controllers)
```

#### Controller Class
`app.controller` and `app.loadCtrls` are all used to create `Controller`, and most design of
`Controller` are inspired by [sundae](https://github.com/sailxjx/sundae) which based on express. But I make action to be more functional, and handle the context as an argument in action. And I prefer put all dependencies in context, rather then require them in the begin of a code file. I think that will make action easy to test in real project.

- Controller#mixin  
`mixin` will add actions to `this._actions` of controlller. And actions can be invoked as api handler or used to be a hook  

  ```js
  const mixins = requireDir('../mixins')
  ctrl.mixin(minins)
  ```  
- Controller#action  
`action` will add an action to `this._actions`  
  
  ```js
  ctrl.action('action1', function(ctx) {...})
  ```  
- Controller#before  
`before` will set an action as pre hook of other action, and it take options to indicate actions to hook  

  ```js  
  // this will hook `hello` action before `foo` and `bar`
  ctrl.before('hello', {only: 'foo bar'})
  // this operation will return an generator combine hello and foo
  ctrl.invoke('foo') 
  ```
  
- Controller#after  
The same as `before`, but add post hook to actions  
  
  ```js
  // this operation will add post hook to every actions except action named married
  ctrl.after('bye', {except: 'married'})
  
  ```
  
- Controller#invoke  
Will return a generator, used in `koa-router` module.  
  
  ```js
  ctrl.invoke('hello')
  ```

### Swagger API
I used to write business code and document of code separately. I think that way to write code cant make me more productive. I want to Document can decribe code and code can be document. And Swagger have done this. I found hapi-swagger is really awesome project to do this. But the way to write code in hapi is not my tea, so i rebuild `kox`

#### api describe  
```js
{
	method: 'get',
	path: '/hello',
	handler: 'controller.action' // or you can write an function directly
	tags: ['Hello'],
	summary: 'say hello',
	description: 'this api will return hello world',
	// validate definition is the same as hapi, using joi as validator
	validate: {
		payload: Joi.object({...}),
		params: ...,
		query: ...,
		headers: ...
	},
	responses: {
		200: {
			description: 'success',
			schema: Joi.object({}) // we validate response by schema
		}
	}
}
```

## LICENSE

MIT

## TODO
* [x] Generate Swagger Json Route
* [x] Auto route api
* [ ] Full Example
* [ ] Full documents
* [ ] Rendering API

[npm-image]: https://img.shields.io/npm/v/kox.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/kox
[travis-image]: https://img.shields.io/travis/sunfuze/kox/master.svg?style=flat-square
[travis-url]: https://travis-ci.org/sunfuze/kox
