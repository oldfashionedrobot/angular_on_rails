# Angular SPA on Rails: Walkthrough
This walkthrough will take you from a basic server-side only Rails app to having an Angular SPA on the front end that talks to the Rails back end via AJAX requests and JSON responses.

This repo has a basic Rails app with two models, Users and Notes. Users can sign up,  log in, and perform CRUD actions on Notes. Authentication functionality is provided by the [Devise](https://github.com/plataformatec/devise) gem.

Currently, everything is rendered server-side, and there is no JS on the front end.

Before we get started, you'll need to clone this repo and get the app set up locally. You can do so with the following commands:
```
$ git clone https://github.com/oldfashionedrobot/angular_on_rails.git
$ cd angular_on_rails
$ bundle install
$ rails db:create
$ rails db:migrate
```
That should clone the app, install the gems, and set up your database. You can run the server with `rails s`. Once it's running, try creating a User for yourself by signing up.

## Adding angular to Rails
In this walkthrough we're going to use NPM to manage our front end dependencies. In the command line run:
```
$ npm init
```
Go through all the NPM prompts. Then we'll initialize Git and tell it to ignore the `/node_modules` folder that NPM creates.
```
$ git init
$ echo '/node_modules' >> .gitignore
```

In `/config/application.rb` we'll need to tell Rails to add the `/node_modules` folder to the asset pipeline.
```ruby
# /config/application.rb
module AngularOnRails
  class Application < Rails::Application
    config.assets.paths << Rails.root.join('node_modules') # Add this line
```

Now we've got NPM all set up, we can install Angular and UI-Router.
```
$ npm install angular --save
$ npm install angular-ui-router@1.0.0-rc.1 --save
```
Once those are downloaded, we need to tell rails to include them into our JS by adding the following lines to `app/assets/javascripts/application.js`
```javascript
//= require angular/angular
//= require angular-ui-router/release/angular-ui-router
```
The order of these `require` statements matter, so your `application.js` file should look something like this:
```javascript
//= require jquery
//= require jquery_ujs
//= require angular/angular
//= require angular-ui-router/release/angular-ui-router
//= require_tree .
```
Now we have Angular and UI-Router accessible in our app, and since we also set up NPM we can use it to install any other front end modules we might need later.

## Setting up routes
Currently, our routing and view rendering is all being handled by the Rails server.
In an Angular [SPA](https://en.wikipedia.org/wiki/Single-page_application), the routes and view rendering happens on the front end, and the server
simply acts as an [API](https://en.wikipedia.org/wiki/Application_programming_interface), providing JSON endpoints that can respond to AJAX requests.

If you look at the `/config/routes.rb` file, you'll see this:
```ruby
Rails.application.routes.draw do
  devise_for :users

  resources :notes

  root to: 'notes#index'
end
```
Right now if you go the path `/notes` in your app, you'll see a view rendered by a Rails controller. We want our Angular app to handle our views, but we still need our Rails routes available to be able to get data from the back end to the front end.

To do that we'll need to put our Rails routes in a [namespace](https://en.wikipedia.org/wiki/Namespace). This allows us to name our Rails and Angular routes whatever we want and not worry about them overlapping. Change your `/config/routes.rb` file to look like this:
```ruby
Rails.application.routes.draw do
  devise_for :users

  namespace :api do
    resources :notes
  end
end
```
By wrapping our Notes routes in a namespace, the old path like `/notes` now would be `/api/notes`. Notice that we also want to remove the `root to: 'notes#index'` line, since our root path will be handled by Angular.

When using routes with a namespace, Rails expects the controller the routes point to to be in a folder with the same name. In `app/controllers`, you'll see our `notes_controller.rb`. We'll need to do the following:
1. Create a folder called `api` in the `app/controllers` folder.
2. Move our `notes_controller.rb` file into the new `app/controllers/api` folder.
3. Edit the first line of the `notes_controller.rb` file and put `Api::` in front of `NotesController`

The top line of your `notes_controller.rb` file should look like this:
```ruby
class Api::NotesController < ApplicationController
```

## Creating our Api Controller
Our `Api::NotesController` currently isn't very API-like. It will still try to render html views. We need to update the controller to simply render JSON. With Rails, this is actually really simple to do.

First we can get rid of the `new` and `edit` methods. Then change the remaining methods like so:
#### index
```ruby
# change this
# GET /notes
def index
  @notes = current_user.notes
end

# to this
# GET /api/notes
def index
  @notes = current_user.notes
  render json: @notes
end
```
#### show
```ruby
# change this
# GET /notes/1
def show
  @note = current_user.notes.find(params[:id])
end

# to this
# GET /api/notes/1
def show
  @note = current_user.notes.find(params[:id])
  render json: @note
end
```
#### create
```ruby
# change this
# POST /notes
def create
  @note = Note.new(note_params)

  if @note.save
    redirect_to @note, notice: 'Note was successfully created.'
  else
    render :new
  end
end

# to this
# POST /api/notes
def create
  @note = Note.new(note_params)

  if @note.save
    render json: @note, status: :created
  else
    render json: @note.errors, status: :unprocessable_entity
  end
end

```
#### update
```ruby
# change this
# PATCH/PUT /notes/1
def update
  @note = current_user.notes.find(params[:id])

  if @note.update(note_params)
    redirect_to @note, notice: 'Note was successfully updated.'
  else
    render :edit
  end
end

# to this
# PATCH/PUT /api/notes/1
def update
  @note = current_user.notes.find(params[:id])

  if @note.save
    render json: @note, status: :ok
  else
    render json: @note.errors, status: :unprocessable_entity
  end
end
```
### destroy
```ruby
# change this
# DELETE /notes/1
def destroy
  @note = current_user.notes.find(params[:id])

  @note.destroy

  redirect_to notes_url, notice: 'Note was successfully destroyed.'
end

# to this
# DELETE /api/notes/1
def destroy
  @note = current_user.notes.find(params[:id])

  @note.destroy

  render json: '', status: :no_content
end
```
With just a few lines of code, we changed all the old HTML rendering routes to simply render JSON. If your server is running (you might need to restart it) you can test out one of these routes by going to `/api/notes` in your browser. If you have no data, you can run `rails db:seed` to create some (Make sure you've at least created a User with the sign up form first).

You can also get rid of the `app/views/notes` folder, since we're only rendering JSON directly from the controller now.

## Serve up our front end
Right now, if you go to `localhost:3000`, you'll just see the Rails welcome page. We'll need to make that root path serve up the HTML/CSS/JS that our Angluar app will handle. To do this, we'll need to create a new Rails controller that renders an HTML page.

#### Client Controller
Create a file called `client_controller.rb` in the `app/controllers` folder. In that new file add this code:
```ruby
class ClientController < ApplicationController
  layout false

  def index
  end
end
```
All this controller does is render an HTML file for us, and that HTML file will have all our Angular code in it. We also have `layout false` because we don't want to use the default application layout template, because that will be used to wrap the views that Devise made for us.

#### Client Index Template
Create a new folder in the `app/views` folder and call it `client`. In that new folder, create a new file called `index.html.erb`. Add the following to the new file:
```erb
<!-- in app/views/client/index.html.erb -->
<!DOCTYPE html>
<html>
  <head>
    <title>AngularOnRails</title>
    <%= csrf_meta_tags %>

    <%= stylesheet_link_tag    'application', media: 'all' %>
    <%= javascript_include_tag 'application' %>
  </head>

  <body>
    <nav>
      <% if user_signed_in? %>
        <%= link_to 'Home', root_path %>
        <%= link_to 'Edit account', edit_user_registration_path, target: '_self' %>
        <%= link_to 'Sign out', destroy_user_session_path, method: 'delete', target: '_self' %>
      <% end %>
    </nav>

    <p class="notice"><%= notice %></p>
    <p class="alert"><%= alert %></p>

    <h1>This is our Front end</h1>

    <ui-view></ui-view>
  </body>
</html>
```
You'll notice that it looks basically the same as the `app/views/layouts/application.html.erb` file, but with a few differences:
* Instead of using `<%= yield %>` we use the `<ui-view></ui-view>` element.
* We have to add `target: '_self'` to the links to Devise pages, to tell UI-Router to not deal with those links.
* **We'll also need to remove** the `<%= javascript_include_tag 'application' %>` line from our `application.html.erb` file. We don't want to load our Angular stuff on the Devise views, they will be all server side.

Your `app/views/layouts/application.html.erb` should look something like this:
```html
<!DOCTYPE html>
<html>
  <head>
    <title>TestApp</title>
    <%= csrf_meta_tags %>

    <%= stylesheet_link_tag    'application', media: 'all' %>
  </head>

  <body>

    <p class="notice"><%= notice %></p>
    <p class="alert"><%= alert %></p>

    <%= yield %>
  </body>
</html>
```

#### Client Routes
We have our controller and view set up, but we still need to tell Rails to route to them. Add the following lines to the `config/routes.rb` file just before the `end`:
```ruby
root to: 'client#index'
get '*path', to: 'client#index'
```
The `root to:` line sends the base url `localhost:3000` to the `app/views/client/index.html.erb` HTML file we just made. The `get '*path'` line sends any other routes that don't match anything to the same file. Basically, those would be routes that we didn't tell Rails how to handle, so we want to send it to the front end and let Angular handle them.

If you load `localhost:3000` in your browser now, (might need to restart your server) you should see the new view we just made.

## Set up our Angular app
We'll use the `app/assets/javascripts/application.js` file to initialize our Angular app and and to set our UI-Router routes. We'll just create one route for now. Edit your `application.js` file to look like below.
```javascript
// !!! In app/assets/javascripts/application.js !!!
//= require jquery
//= require jquery_ujs
//= require angular/angular
//= require angular-ui-router/release/angular-ui-router
//= require_self
//= require_tree .

angular
  .module('myAppName', ['ui.router'])
  .config(function ($stateProvider, $urlRouterProvider, $locationProvider) {
    $stateProvider
      .state('home', {
        url: '/',
        component: 'homePage'
      });

    // default fall back route
    $urlRouterProvider.otherwise('/');

    // enable HTML5 Mode for SEO
    $locationProvider.html5Mode({
      enabled: true,
      requireBase: false
    });
  });
```
Notice the `//= require_self` that was added above the `//= require_tree .` line. This makes sure that this app initialization/configuration code is loaded before the rest of the files in the `app/assets/javascripts` directory.

Bind our new app to the `app/views/client/index.html.erb` view by adding `ng-app="myAppName"` on the opening `<body>` tag.
```html
<body ng-app="myAppName">
```

## Create a Component
In our `home` state we set with UI-Router above, we pointed it at a `homePage` component. Before we create it, we'll need to add a folder called `components` in the `app/assets/javascripts` folder.

In the new `app/assets/javascripts/components` folder, create a folder called `homePage`, and add three files to it:
* `homePage.js.erb`
* `homePage.html`
* `homePage.scss`

In the new `app/assets/javascripts/components/homePage/homePage.js.erb` file, add the following:
```javascript
/// !!! in app/assets/javascripts/components/homePage/homePage.js.erb
angular
  .module('myAppName')
  .component('homePage', {
    templateUrl: '<%= asset_path("components/homePage/homePage") %>',
    controller: HomePageController
  });

HomePageController.$inject = ['$http'];

function HomePageController($http) {
  var vm = this;

  vm.message = 'Hello World!';
  vm.notes = [];

  $http.get('/api/notes').then(function(resp) {
    vm.notes = resp.data;
  });
}
```
Notice that because we added `.erb` after `.js` in the file name, we can use ERB tags and take advantage of Rails's `asset_path` helper method.


And in `app/assets/javascripts/components/homePage/homePage.html` add:
```html
<!-- !!! In app/assets/javascripts/components/homePage/homePage.html -->
<h1>Home Page</h1>
<p>
  {{ $ctrl.message }}
</p>

<p ng-repeat="note in $ctrl.notes">
  Title: {{ note.title }}
  <br/>
  Body: {{ note.body }}
</p>
```
Finally, in `app/assets/javascripts/components/homePage/homePage.scss` add:
```scss
body {
  h1 {
    font-family: Georgia, serif;
    color: #ddd;
  }

  p {
    font-family: Arial, serif;
  }
}
```
In order to get Rails to pull in any `.css` or `.scss` in our components folders, we need to add a line to `app/assets/styleshees/application.css`.

Right above the `*= require_tree .` line, add `*= require_tree ../javascripts/components/` like below:
```css
 *= require_tree ../javascripts/components/
 *= require_tree .
 *= require_self
 */

```
_Rails by default comes with a SASS gem, so if you want to use it, you can just rename your `.css` file to `.scss` and you can start coding with SASS._


Refresh the page (might need to restart server) and our `homePage` component should be rendered. You can now add components to the `app/assets/javascripts/components` folder in the same way we added the `homePage` component, and they'll properly be pulled into the Asset Pipeline.
