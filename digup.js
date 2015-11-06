var FS = require('fs');
var EE = require('events').EventEmitter;
var PATH = require('path');
var SPAWN = require('child_process').spawn;
var RL = require('readline');
var C = require('colors');

/**
 * Digout
 *
 * This is the function that processes files and evaluates the search.
 * It accepts one argument. If the package is ran from the command line, it
 * will represent the arguments passed.
 *
 * If the function is not executed in a pipeline (process.stdin.isTTY !== true)
 * the first element of the array will be used as the "path" passed to the
 * "find" unix/linux command, and the rest of the arguments will be used as
 * query strings.
 *
 * Otherwise, all the elements of the array will be treated as
 * query strings.
 *
 * Printing the output is handled by bin/digup file.
 *
 * Events fired on the dispacher returned:
 *
 * - collector::path - Fired when the collector detects that a new path
 *     is passed to the process, either trough process.stdin or by reading the
 *     output of the "find" command. It will carry one argument - a string
 *     representing a path.
 *
 * - collector::done - Fired when there will be no more paths passed to the
 *     process, or an error has occured and the ops are stopped.
 *
 * - reader::read - Fired when the file path has been verified as a valid file
 *     path and it has been successfully stored in the files buffer.
 *
 * - reader::line - Fired when the new line is read by the reader. It is fired
 *     with one argument - a line object, with the following properties:
 *     - text - String that represents a line
 *     - row  - Line number the line was found at
 *     - from - File path the line was read from
 *
 * - finder::match - Fired when the line passes the query test. The same line
 *     object is passed as an argument as in "reader::line" event, but the
 *     "text" property has a string already formated (colored), ready to be
 *     printed out.
 *
 * 
 * @param   {array} args - Array of string arguments.
 * @returns {EventEmmiter} An event emmiter used to delegate
 *                         responsibility accross the process.
 *
 * @function
 * @author Nikola Kanacki <@nikolakanacki>
 * @since 0.1.0
 */

module.exports = function (args) {
  
  var disp = new EE();
  
  /*
   * Collector
   *
   * Setup the collecting process
   * where we normalize file paths input.
   */
  
  (function(disp,args) {
    
    if (!process.stdin.isTTY) {
      
      var seeder = process.stdin;
      
    } else {
      
      var path = args.shift();
      var find = SPAWN('find',[
        '-L',path,'-type','f','-not','-path','*/\\.*'
      ],{
        cwd: process.cwd()
      }).on('error',function(e){
        console.log('CP_ERROR',e.toString());
      });
      
      find.stderr.on('data',function(d){
        console.log('CP_STDERR',d.toString());
      });
      
      var seeder = find.stdout;
      
    }
    
    var rl = RL.createInterface({
      input: seeder,
      terminal: false
    });
      
    rl.on('line' ,function(l){ disp.emit('collector::path',l.trim())  });
    rl.on('close',function( ){ disp.emit('collector::done')           });
    rl.on('error',function(e){ rl.emit('close')                       });
    
    return disp;
    
  })(disp,args);
  
  /*
   * Reader
   *
   * Setup file reading process
   * using the readline interface
   */
  
  (function(disp,args){
    
    var files = [];
    var reading = false;
    
    disp.on('reader::read',function(){
      
      if (reading) return;
      
      var path = files.shift();
      if (!path) return;
      var ln = 0;
      
      var rl = RL.createInterface({
        input: FS.createReadStream(path,{encoding:'utf8'}).on('error',
          function(e){ rl.emit('close') }
        ),terminal: false
      });
      
      reading = true;
      
      rl.on('line',function(line){
        ln++; disp.emit('reader::line',{
          row: ln,
          text: line,
          from: path
        });
      }).on('close',function(){
        reading = false;
        disp.emit('reader::read');
      }).on('error',function(){
        reading = false;
        disp.emit('reader::read');
      });
      
    });
    
    disp.on('collector::path',function(path){
      
      try {
        var valid = FS.statSync(path).isFile();
      } catch (e) {
        var valid = false
      } if (valid) {
        files.push(path);
        disp.emit('reader::read');
      }
      
    });
    
  })(disp,args);
  
  /*
   * Finder
   *
   * Setup the search process.
   */
  
  (function(disp,args){
    
    var query = args.map(function(q){
      return new RegExp('('+q.replace(
        /([\\\.\+\*\?\[\^\]\$\(\)\{\}\=\!\<\>\|\:])/g, "\\$1"
      )+')','ig');
    });
    
    var matchid = 0;
    
    if (query.length) {
      
      disp.on('reader::line',function(line){
    
        if (typeof line.text !== 'string') return;
        
        var found = 0;
        
        query.forEach(function(q){
          
          q.lastIndex = 0;
          
          if (line.text.match(q)) {
            found++; line.text = line.text.replace(q,'$1'.cyan);
          }
          
        });
        
        if (found == query.length) {
          
          line.matchid = matchid++;
          disp.emit('finder::match',line);
          
        }
        
      });
      
    } else {
    
      disp.on('reader::line',function(line){
    
        if (typeof line.text !== 'string') return;
        
        line.matchid = matchid++;
        disp.emit('finder::match',line);
        
      });
  
    }
    
  })(disp,args);
  
  return disp;
  
}