#!/bin/sh

srcdir=`dirname "$0"`

npm install

python3 -m venv ${srcdir}/env
source ${srcdir}/env/bin/activate
pip install -r requirements.txt
