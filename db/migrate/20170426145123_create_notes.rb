class CreateNotes < ActiveRecord::Migration[5.0]
  def change
    create_table :notes do |t|
      t.text :body
      t.string :title
      t.references :user
      t.string :category

      t.timestamps
    end
  end
end
