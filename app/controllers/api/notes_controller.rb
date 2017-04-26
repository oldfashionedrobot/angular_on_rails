class Api::NotesController < ApplicationController
  # GET /api/notes
  def index
    @notes = current_user.notes

    render json: @notes
  end

  # GET /api/notes/:id
  def show
    @note = current_user.notes.find(params[:id])

    render json: @note
  end

  # POST /api/notes
  def create
    @note = Note.new(note_params)

    if @note.save
      render json: @note, status: :created
    else
      render json: @note.errors, status: :unprocessable_entity
    end
  end

  # PATCH/PUT /api/notes/:id
  def update
    @note = current_user.notes.find(params[:id])

    if @note.update(note_params)
      render json: @note, status: :ok
    else
      render json: @note.errors, status: :unprocessable_entity
    end
  end

  # DELETE /api/notes/:id
  def destroy
    @note = current_user.notes.find(params[:id])

    @note.destroy

    render json: '', status: :no_content
  end

  private
  # Only allow a trusted parameter "white list" through.
  # Also we want to add the current_user's id to the hash
  # We can do that with .merge
  def note_params
    params.require(:note)
          .permit(:body, :title, :category)
          .merge(user_id: current_user.id)
  end
end
