#!/bin/bash

apt-get update
apt-get install -y awscli
apt-get install -y jq

aws secretsmanager get-secret-value --region eu-west-1 --secret-id bdp/careem-insights --query SecretString --output text | jq -r 'to_entries|map("\(.key)=\(.value|tostring)")|.[]' > /tmp/secrets.env

while read p; do
export "$p"
done < /tmp/secrets.env
