#!/bin/bash
cd "$(dirname "$0")"
sleep 2 && open http://localhost:5173 &
npm run dev
