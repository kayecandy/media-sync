eval $(egrep -v '^#' .env | xargs)

scp -i "$SSH_KEY_FILE" -P $SSH_PORT .env.deploy  $SSH_USERNAME@$SSH_SERVER:~/media-sync

ssh -t -i "$SSH_KEY_FILE" $SSH_USERNAME@$SSH_SERVER -p $SSH_PORT "cd ~/media-sync; git fetch; git checkout origin/master; pm2 delete media-sync; mv .env.deploy .env; npm install; pm2 --name media-sync start npm -- start; pm2 logs"