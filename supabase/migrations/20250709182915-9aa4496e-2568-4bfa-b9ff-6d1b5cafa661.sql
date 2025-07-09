-- Add connection_id to user_special_dates to link events to specific user connections
ALTER TABLE user_special_dates 
ADD COLUMN connection_id uuid REFERENCES user_connections(id) ON DELETE SET NULL;

-- Add index for better query performance  
CREATE INDEX idx_user_special_dates_connection_id ON user_special_dates(connection_id);