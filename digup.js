var FS = require('fs');
var EE = require('events').EventEmitter;
var PATH = require('path');
var SPAWN = require('child_process').spawn;
var RL = require('readline');
var C = require('colors');

/**
 * Digout
 * 
 * @param   {object} conf  - Configuration object.
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
          row:   ln,
          from:  path,
          value: line || ''
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
    
    var expanding = conf.expand ? true : false;
    var id        = 0;
    var past      = [];
    var match     = false;
    var future    = [];
    
    /*
     * An inner normalization event
     * for preparing matches
     */
    
    disp.on('finder::export',function(l){
      
      var exp     = l;
      exp.past    = past;
      exp.future  = future;
      exp.matched = true;
      
      if (exp.id > -1) exp.id = exp.id.toString();
      
      disp.emit('finder::match',exp,expanding);
      
      match = false;
      
    });
    
    /*
     * If query is defined perform
     * the search
     */
    
    if (conf.query && conf.query.length) {
      
      /*
       * When the reader (file) closes, if we have an unexported
       * match (line that has been waiting for the full expension)
       * export it.
       */
      
      disp.on('reader::close',function(){
        
        if (match) disp.emit('finder::export',match);
        
      });
      
      /*
       * Listen to new lines feed
       * from the reader
       */
      
      disp.on('reader::line',function(line){
        
        var found = 0;
        
        /*
         * Perform the query matching
         */
        
        conf.query.forEach(function(q){
          
          if (line.value.match(q)) {
            
            found++; line.value = line.value.replace(q,'$1'.cyan);
            
          } q.lastIndex = 0;
          
        });
        
        /*
         * If the match was positive
         * see if we're ready to export.
         */
        
        if (found == conf.query.length) {
          
          line.id      = id++;
          line.matched = true;
          
          if (!expanding) {
            
            disp.emit('finder::export',line);
            
          } else if (conf.expand.id == line.id) {
            
            match = line;
            
          }
          
          /*
           * If not, see if we need to use the line
           * in an expansion process.
           */
          
        } else if (expanding) {
          
          if (conf.expand.size >= past.length && !match) past.push(line);
          if (past.length > conf.expand.size) past.shift();
          
          if (conf.expand.size > future.length && match) future.push(line);
          if (future.length > conf.expand.size) future.shift();
          
          /*
           * If we filled the future array (which means we already
           * filled the past array), and we have a valid match, export.
           */
          
          if (conf.expand.size == future.length && match) {
            
            disp.emit('finder::export',match);
            
          }
          
        }
        
      });
      
    } else {
    
      disp.on('reader::line',function(line){
    
        if (typeof line.value !== 'string') line.value = '';
        
        line.id = id++;
        disp.emit('finder::export',line);
        
      });
  
    }
    
  })(disp,conf);
  
  return disp;
  
}