#!/bin/sh
set -e

echo "Running package test...";
echo;

BASE_DIR="$(cd "$(dirname "$0")/.."; pwd)";
cp "$BASE_DIR/package.tgz" "$BASE_DIR/package/curve-ops.tgz";

cd "$BASE_DIR/package";
rm -rf node_modules/curve-ops || true;
npm install --audit=false;
rm curve-ops.tgz || true;
npm -s test;
cd - >/dev/null;

echo;
echo "Package test complete";
echo;
