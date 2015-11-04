![digup](http://cdn.nikolakanacki.com/pub/va/digup.png)

# digup

A handy command line tool written in javascript that reads files down the directory tree line by line printing out lines that match all of the passed arguments.

[![npm](https://img.shields.io/badge/npm-1.0.2-green.svg)](https://www.npmjs.com/package/digup)
[![dependencies](https://david-dm.org/nikolakanacki/digup.svg)](https://david-dm.org/nikolakanacki/digup)
![node](https://img.shields.io/badge/node-4.2.1-green.svg)
![tested](https://img.shields.io/badge/tested-linux%20|%20osx-green.svg)

It's dead simple, pretty fast (almost as fast as `grep`) and it leverages a super-straightforward syntax **(no dashed options are required)** which all makes it a perfect tool for frequent project searches - eg. finding `@todo`s in the current project (cwd) is as easy as `digup . @todo`.

Two shovels of `digup`:

1. A standalone digger, making use of `find` command internally to get the file paths recursively, eg. `digup . @todo` (the example from above),
2. A pipeline digger, receiving a stream of file paths and searching among them, eg. `ls -1 | digup @todo`.  
Here the search will be performed on the files passed on with the output of `ls` command.  
Notice the missing `.` (dot) as the first argument. When in this mode, all the arguments are treated as query strings since we are not using `find` command internally, and that first `<path>` argument is not needed.

## Install

```bash
$ [sudo] npm install -g digup
```

## Usage

```bash
# Standalone mode
$ digup <path> [query-args]

# Pipeline mode
$ <cmd-outputting-paths> | digup [query-args]
```

## Example

```bash
# Standalone mode
$ digup . @todo @frontend popup

# Pipeline mode
$ ls -1 | digup @todo @frontend popup
```

## Upcoming release notes
- Enable full regex search
- Enable pseudo regex search (`!`,`|`,`*`)
- Include options for output formatting and expansion
- Better error handling

## License

Copyright 2015 Nikola Kanacki (office@nikolakanacki.com)

This project is free software released under the MIT/X11 license:

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
