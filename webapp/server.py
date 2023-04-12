#!/usr/bin/python3
from flask import Flask, request, render_template, Response
import logging

app = Flask(__name__)
app.logger.setLevel(logging.INFO)

@app.route("/")
def hello(name=None):
    return render_template('index.html')