Rails.application.routes.draw do
  devise_for :users

  namespace :api do
    resources :notes
  end
end
