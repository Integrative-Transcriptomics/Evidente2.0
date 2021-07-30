#!/bin/sh

srcdir=`dirname "$0"`

npm ci

python3 -m venv ${srcdir}/env
${srcdir}/env/bin/python3 -m pip install --upgrade pip
${srcdir}/env/bin/python3 -m pip install six
${srcdir}/env/bin/python3 -m pip install appdirs
${srcdir}/env/bin/python3 -m pip install packaging
${srcdir}/env/bin/python3 -m pip install ordered_set
${srcdir}/env/bin/python3 -m pip install goatools
${srcdir}/env/bin/python3 -m pip install flask
${srcdir}/env/bin/python3 -m pip install parse
