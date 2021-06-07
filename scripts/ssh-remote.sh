eval $(egrep -v '^#' .env | xargs)

ssh -t -i "$SSH_KEY_FILE" $SSH_USERNAME@$SSH_SERVER -p $SSH_PORT "cd ~/media-sync; bash --login"