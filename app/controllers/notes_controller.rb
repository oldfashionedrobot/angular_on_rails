class NotesController < ApplicationController
  # GET /notes
  def index
    @notes = current_user.notes
  end

  # GET /notes/1
  def show
    @note = current_user.notes.find(params[:id])
  end

  # GET /notes/new
  def new
    @note = Note.new
  end

  # GET /notes/1/edit
  def edit
    @note = current_user.notes.find(params[:id])
  end

  # POST /notes
  def create
    @note = Note.new(note_params)

    if @note.save
      redirect_to @note, notice: 'Note was successfully created.'
    else
      render :new
    end
  end

  # PATCH/PUT /notes/1
  def update
    @note = current_user.notes.find(params[:id])

    if @note.update(note_params)
      redirect_to @note, notice: 'Note was successfully updated.'
    else
      render :edit
    end
  end

  # DELETE /notes/1
  def destroy
    @note = current_user.notes.find(params[:id])

    @note.destroy

    redirect_to notes_url, notice: 'Note was successfully destroyed.'
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
