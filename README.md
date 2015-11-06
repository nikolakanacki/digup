![digup](http://cdn.nikolakanacki.com/pub/va/digup.png)

# digup

A handy command line tool written in javascript made for extensive text search.  
Very frequent, streamlined, increasingly awesome text search.

It's dead simple, pretty fast, and leverages a super-straightforward syntax (no dashed options are required to kickoff a basic search, and few **awesome ones** are available overall) which makes it a perfect tool for frequent project searches - eg. finding `@todo`s in the current project (`cwd`) is as easy as `digup . @todo`.

**! New in version 1.1.0 - LINE EXPANSION feature (read below) !**

![version](https://img.shields.io/badge/version-1.1.2-green.svg)
[![dependencies](https://david-dm.org/nikolakanacki/digup.svg)](https://david-dm.org/nikolakanacki/digup)
[![npm](https://img.shields.io/badge/npm-1.1.2-green.svg)](https://www.npmjs.com/package/digup)
![node](https://img.shields.io/badge/node-4.2.1-green.svg)
![tested](https://img.shields.io/badge/tested-linux%20|%20osx-green.svg)

**Speed:** Wordpress directory / `2371` files / `639927` lines / `2` arguments / `~0.6` seconds.

## Install

```bash
$ [sudo] npm install -g digup
```

## Usage

```bash
# Standalone mode
$ digup <path> [query-args] [options]

# Pipeline mode
$ <command-outputting-file-paths> | digup [query-args] [options]
```

## Examples

### Standalone mode

```bash
$ digup . @todo @frontend popup
```
  
This example will go down your current directory tree (`.`), scan files (as individual lines) searching for the keywords `@todo`,`@frontend` and `popup` to appear on the same line.

### Pipeline mode

```bash
$ ls -1 | digup @todo @frontend popup
```

This example will do the exact same thing as the example above, but instead of going trough all the files it can find down the current directory tree, it will operate on the paths outputted by `ls -1` (which lists the current directory **only**) in a single column.

### Expand to get the context

```bash
$ <standalone/pipeline> -e21
```

The lines outputted will take the following form:

```
<match-id>: <file-path>[<line-number>] <line-content>
```  

For the sake of the argument, let's say you had about 30 of the lines matching the search criteria, and the 21st registered matched line is:

```
21: ./file/path.js[48]  * @todo Finish up the popups @frontend
```

Appending to the examples above with an `-e` (`--expand`) option, we will enter an "expanded" mode of the matched line, where we use the previously obtained `match-id` to preview it's surrounding context. Adding `-e21` (it's `match-id`) to the end of the previous example command will print the 10 lines surrounding the matched line (5 before and 5 after). Default value is 5, but it can be changed by providing a second argument in the form of `-e21/<number-of-lines-on-each-side>`.

So now the output could look something like this:


```
    ./file/path.js[42]  * My awesome function
    ./file/path.js[43]  *
    ./file/path.js[44]  * @param {number} pad   - Description
    ./file/path.js[45]  * @param {string} input - Description
    ./file/path.js[46]  *
21: ./file/path.js[48]  * @todo Finish up the popups @frontend
    ./file/path.js[49]  *  - task 1
    ./file/path.js[50]  *  - task 2
    ./file/path.js[51]  *  - task 3
    ./file/path.js[52]  */
    ./file/path.js[53]  function myAwesomeFunction (pad,input) {
```

Basically, by adding `-e21` to your command, you have a whole context of the particular result.

### Beyond digging

```bash
$ <standalone/pipeline> -e21 -p
```

Take a notice of the `-p` flag here, since this example extends the previous ones. When using the extended context (`-e`,`--extend`) you have an option to pass the `pick` flag (`-p`,`--pick`) which will only output the path of the file that contained the line under an ID chosen by the extender.

In the case of our example, the output would be:

```
./file/path.js
```

You can now pipe this output further (eg. `xargs cat` which will read the whole file so you can proceed with an inspection beyond digging).

## Upcoming release notes
- ~~Include options for output formatting and line expansion~~ > Featured in 1.1.0
- Enable search on `stdin`
- Enable full regex search
- Enable case sensitivity option
- Enable pseudo regex search (`!`,`|`,`*`)

## Changelog
- 1.1.2
  - Fixing a missing dependency in package.json
- 1.1.1
  - Fixing the loosely published npm package
- 1.1.0
  - Adding line expansion
  - Adding "pick" option
  - Moving all of the **cli** logic to `bin/digup` so the package can be required in other projects without relying on the command line
- 1.0.4
  - First stable copy

## License

Copyright 2015 Nikola Kanacki (office@nikolakanacki.com)

This project is free software released under the MIT/X11 license:

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

