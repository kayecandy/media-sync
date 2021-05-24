eval $(egrep -v '^#' .env | xargs)

ssh -t -i "$SSH_KEY_FILE" $SSH_USERNAME@$SSH_SERVER -p $SSH_PORT "cd ~/media-sync; git pull; pm2 delete media-sync; pm2 --name media-sync start npm -- start; pm2 logs"