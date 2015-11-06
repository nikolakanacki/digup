var FS = require('fs');
var EE = require('events').EventEmitter;
var PATH = require('path');
var SPAWN = require('child_process').spawn;
var RL = require('readline');
var C = require('colors');

/**
 * Digout
 * 
 * @param   {object} argv  - Configuration
 * @returns {EventEmmiter}   An event emmiter that delegates responsibility
 *                           accross the process.
 *
 * @function
 * @author Nikola Kanacki <@nikolakanacki>
 * @since 0.1.0
 */

module.exports = function (conf) {
  
  var disp = new EE();
      conf = conf || {};
  
  /*
   * Collector
   *
   * Setup the collecting process
   * where we normalize file paths input.
   */
  
  (function(disp,conf) {
    
    if (!conf.mode || conf.mode == 'standalone') {
      
      var find = SPAWN('find',[
        '-L',conf.path,'-type','f','-not','-path','*/\\.*'
      ],{
        cwd: process.cwd()
      }).on('error',function(e){
        console.log('CP_ERROR',e.toString());
      });
      
      find.stderr.on('data',function(d){
        console.log('CP_STDERR',d.toString());
      });
      
      var seeder = find.stdout;
      
    } else {
      
      var seeder = process.stdin;
      
    }
    
    var rl = RL.createInterface({
      input: seeder,
      terminal: false
    });
      
    rl.on('line' ,function(l){ disp.emit('collector::path',l.trim())  });
    rl.on('close',function( ){ disp.emit('collector::done')           });
    rl.on('error',function(e){ rl.emit('close')                       });
    
    return disp;
    
  })(disp,conf);
  
  /*
   * Reader
   *
   * Setup file reading process
   * using the readline interface
   */
  
  (function(disp,conf){
    
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
        disp.emit('reader::close');
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
    
  })(disp,conf);
  
  /*
   * Finder
   *
   * Setup the search process.
   */
  
  (function(disp,conf){
    
    var matchid = 0;
    var past    = [];
    var target  = false;
    var future  = [];
    
    disp.on('finder::export',function(l){
      
      var exp = l;
      
      exp.past = past;
      exp.future = future;
      
      disp.emit('finder::match',exp);
      
      target = false; past = []; future = [];
      
    });
    
    if (conf.query && conf.query.length) {
      
      disp.on('reader::close',function(){
        
        if (target) {
          target.past = past;
          target.future = future;
          disp.emit('finder::match',target);
          target = false; past = []; future = [];
        }
        
      });
      
      disp.on('reader::line',function(line){
    
        if (typeof line.text !== 'string') return;
        
        var found = 0;
        
        conf.query.forEach(function(q){
          
          q.lastIndex = 0; if (line.text.match(q)) {
            
            found++;
            line.text = line.text.replace(q,'$1'.cyan);
            
          }
          
        });
        
        if (found == conf.query.length) {
          
          line.matchid = matchid++;
          
          if (!conf.expand) {
            disp.emit('finder::export',line);
          } else if (conf.expand.id == line.matchid) {
            target = line;
          }
          
        } else if (conf.expand) {
          
          if (conf.expand.size >= past.length && !target) past.push(line);
          if (past.length > conf.expand.size) past.shift();
          
          if (conf.expand.size > future.length && target) future.push(line);
          if (future.length > conf.expand.size) future.shift();
          
          if (conf.expand.size == future.length && target) {
            
            disp.emit('finder::export',target);
            
          }
          
        }
        
      });
      
    } else {
    
      disp.on('reader::line',function(line){
    
        if (typeof line.text !== 'string') return;
        
        line.matchid = matchid++;
        disp.emit('finder::export',line);
        
      });
  
    }
    
  })(disp,conf);
  
  return disp;
  
}