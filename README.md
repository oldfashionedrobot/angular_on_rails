# Angular SPA on Rails: Walkthrough
This will walk through creating a Rails app with the [Devise](https://github.com/plataformatec/devise) gem for authentication and Angular + UI-Router on the front end.

A lot of applications built using Angular and Rails will use both Rails server side rendering as well as Angular templates.  Since authentication is so involved, typically apps will let that part of the app be handled using Rails server side rendering.  Once logged in, the user will be allowed access to the Angular app.  

The Angular app will hold all the templates and logic for the app outside of authentication and authorization.  Angular will then use Rails as an API to CRUD information in our database.

_To see how to convert an existing Rails app to use Angular on the front end see the [Readme on this branch](https://github.com/oldfashionedrobot/angular_on_rails/tree/convert)_

## Create a Rails App
Lets use the `rails new` command to create a new Rails app, and `cd` into the directory that gets created. We want to use PostgreSQL, and we don't want to include Turbolinks, because it doesn't work with UI-Router.
```
$ rails new app_name -d=postgresql --skip-turbolinks
$ cd app_name
```
Add the following lines to the Gemfile:
```ruby
gem 'devise'
gem 'angular_rails_csrf'
```
Then install the gems by running:
```
$ bundle install
```
Now let's setup Devise.
```
$ rails g devise:install
```
After that runs, we need to add the following lines to `app/views/layouts/application.html.erb` just below the opening `<body>` tag:
```html
<p class="notice"><%= notice %></p>
<p class="alert"><%= alert %></p>
```
Then we need to add `before_action :authenticate_user!` to the `app/controllers/application_controller.rb` file.  This method is a Devise method which authenticates the user.

```ruby
class ApplicationController < ActionController::Base
  protect_from_forgery with: :exception
  before_action :authenticate_user!
end
```

Assuming we want our Devise model to be called User, we can generate our User model with:
```
$ rails g devise User
```
Then create our database and run migrations with:
```
$ rails db:create
$ rails db:migrate
```

## Adding angular to Rails
In this walkthrough we're going to use NPM to manage our front end dependencies. For the back end, we still need to use the Gemfile.

In the command line run:
```
$ npm init
```
Go through all the NPM prompts (just press enter until the end). 

Then we'll initialize Git and tell it to ignore the `/node_modules` folder that NPM creates.  Here's a shortcut to add 
`/node_modules` to your `.gitignore`
```
$ git init
$ echo '/node_modules' >> .gitignore
```

In `/config/application.rb` we'll need to tell Rails to add the `/node_modules` folder to the asset pipeline.  This allows all our `node_modules` files to compiled in our asset pipeline.

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

Once those are downloaded, we need to tell rails to include them into our JS by adding the following lines to `app/assets/javascripts/application.js`.  

Any NPM package that you install needs to be `require` in this file.

```javascript
<!-- app/assets/javascripts/application.js -->
//= require angular/angular
//= require angular-ui-router/release/angular-ui-router
```

The order of these `require` statements matter.  For example, `jquery_ujs` can not work with first having `jquery`. So your `application.js` file should look something like this:

```javascript
//= require jquery
//= require jquery_ujs
//= require angular/angular
//= require angular-ui-router/release/angular-ui-router
//= require_tree .
```
Now we have Angular and UI-Router accessible in our app. Since we also set up NPM we can install any other front end modules we might need later.

## Serve up our front end
We'll need to make a Rails controller that will serve up the HTML/CSS/JS  from the back end.  Then our Angular app will use that HTML/CSS/JS to use it on the front end.

#### Client Controller
Create a file called `client_controller.rb` in the `app/controllers` folder. In that new file add this code:

```ruby
<!-- app/controllers/client_controller.rb -->
class ClientController < ApplicationController
  layout false

  def index
  end
end
```

This controller action will render the HTML file for us.  We are going to bind our Angular app to that HTML file.  This will allow us to show our Angular views inside the HTML file rendered by Rails.

We also have `layout false` because we don't want to use the default `app/views/layout/application.html.erb`. That layout will be used to wrap the server rendered (Rails) views that Devise made for us.

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

* We have to add `target: '_self'` to the links to Devise pages, to tell UI-Router to not deal with those links.  Those links will be Rails rendered views.


**We'll also need to remove** the `<%= javascript_include_tag 'application' %>` line from our `application.html.erb` file. We don't want to load our Angular stuff on the Devise views.  Remember, Devise views and logic will be all server side (Rails).

Your `app/views/layouts/application.html.erb` should look something like this:
```html
<!-- app/views/layouts/application.html.erb -->
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

The `root to:` line sends the base url `localhost:3000` to Clients Controller Index action.  That action will render the `app/views/client/index.html.erb` HTML file we just made. 

The `get '*path'` line sends any request that doesn't match a route in our `routes.rb` to the `client#index` action. Basically, those requests that we didn't tell Rails how to handle will be pushed to the front end and let Angular handle them.

If you load `localhost:3000` in your browser now, (might need to restart your server) you should see the new view we just made.

## Set up our Angular app
We'll use the `app/assets/javascripts/application.js` file to initialize our Angular app and and to set our UI-Router routes. We'll just create one route for now. Edit your `application.js` file to look like below.

```javascript
// <!-- app/assets/javascripts/application.js  -->
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
Notice the `//= require_self` that was added above the `//= require_tree .` line. This makes sure that the apps initialization/configuration code is loaded before the rest of the files in the `app/assets/javascripts` directory.

Now it's time to bind our Angular app to our Rails rendered view.

Bind our Angular app to the `app/views/client/index.html.erb` view by adding `ng-app="myAppName"` on the opening `<body>` tag.

```html
<!-- app/views/client/index.html.erb -->
<body ng-app="myAppName">
```

## Create a Component
In our `home` state we set with UI-Router above, we pointed it at a `homePage` component. 

Before we create it, we'll need to add a folder called `components` in the `app/assets/javascripts` folder.

In the new `app/assets/javascripts/components` folder, create a folder called `homePage`, and add three files to it:

<!-- Inside folder: app/assets/javascripts/components -->
* `homePage.js.erb`
* `homePage.html`
* `homePage.scss`

In the new `app/assets/javascripts/components/homePage/homePage.js.erb` file, add the following:

```javascript
<!-- app/assets/javascripts/components/homePage/homePage.js.erb -->
angular
  .module('myAppName')
  .component('homePage', {
    templateUrl: '<%= asset_path("components/homePage/homePage") %>',
    controller: HomePageController
  });

HomePageController.$inject = [];

function HomePageController() {
  var vm = this;

  vm.message = 'Hello World!';
}
```

Notice that because we added `.erb` after `.js` in the file name, we can use ERB tags and take advantage of Rails's `asset_path` helper method.


And in `app/assets/javascripts/components/homePage/homePage.html` add:
```html
<!-- app/assets/javascripts/components/homePage/homePage.html -->
<h1>Home Page</h1>
<p>
  {{ $ctrl.message }}
</p>
```

Finally, in `app/assets/javascripts/components/homePage/homePage.scss` add:

```scss
<!-- app/assets/javascripts/components/homePage/homePage.scss -->
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

In order to get Rails to pull in any `.css` or `.scss` in our components folders, we need to add a line to `app/assets/stylesheets/application.css`.

Right above the `*= require_tree .` line, add `*= require_tree ../javascripts/components/` like below:

```css
<!-- app/assets/stylesheets/application.css -->
 *= require_self
 *= require_tree .
 *= require_tree ../javascripts/components/
 */

```
_Rails by default comes with a SASS gem, so if you want to use it, you can just rename your `.css` file to `.scss` and you can start coding with SASS._


Refresh the page (might need to restart server) and our `homePage` component should be rendered. 

All future components will be added to the `app/assets/javascripts/components` folder in the same way we added the `homePage` component.  That way they'll properly be pulled into the Asset Pipeline.

## Make an API Controller
Any Rails controller/routes that we add now should be API-like and just return JSON to AJAX requests that we will call from the Angular front end. We'll also want to namespace them in an `api` namespace. Below will walk through the steps of adding a model and a controller to return JSON data of that model.

First create a model with a generator in the command line, then run migrations.  Without specifying the _types_ for body and title fields, they will default to string.

```
$ rails g model Note body title
$ rails db:migrate
```

We'll just use a simple Note model as an example. Now we'll add a controller for this model. Make a folder called `api` in the `app/controllers` folder. In the new `app/controllers/api` folder add a new file called `notes_controller.rb`.

In the new `app/controllers/api/notes_controller.rb` file add:
```ruby
<!-- app/controllers/api/notes_controller.rb -->
class Api::NotesController < ApplicationController
  # GET /api/notes
  def index
    @notes = Note.all

    render json: @notes
  end
end
```

To add a route for this new controller, we'll need to change our `config/routes.rb` file to look like this:
```ruby
<!-- config/routes.rb -->
Rails.application.routes.draw do
  devise_for :users

  namespace :api do
    resources :notes, only: [:index]
  end

  root to: 'client#index'
  get '*path', to: 'client#index'
end
```
You should now be able to hit the path `/api/notes` in your browser to see a JSON output of all the Notes. 

You probably don't have any in your database yet, so open up a Rails console and create 3 notes and try to view them.

## Next Steps
Inject `$http` into the `homePage` component and use it to make an AJAX request to the `/api/notes` path 

Then display the JSON response data in the view using `ng-repeat`. 

After that, try making the rest of the CRUD views on the front end and routes/actions on the back end.

Also, if you want to be able to write ES6 style JS, check out this gem: https://github.com/TannerRogalsky/sprockets-es6.

<details>

  <summary>Solution</summary>

```javascript
<!-- app/assets/javascripts/components/homePage/homePage.js.erb -->
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
```html
<!-- In app/assets/javascripts/components/homePage/homePage.html -->
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

</details>
