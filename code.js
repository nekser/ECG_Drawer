/**
 * Painter class manages
 */
function ECGPainter() {
    /*
    *Union of several ECGTapes
    *It provides drawing of ECG component according to table- or multiline-parameteres
    *Every ECGBlock has own borders and timeline
    *ECGTapes are vertical located (downwards)
    */
    function ECGContainer(){
        /*
        *Collection of ecg tapes this object contains
        *and counter of tapes
        */
        this.tapes = [];
        this.tapesAmount = 0;
        this.x;
        /*
        *Draw timeline
        */
        this.drawTimeline = function(_x, _y, begintime){
                var time = new Date(0,0,0,0,0,0,0);

                context.lineWidth = 1;
                context.strokeStyle = "black";
                /*
                *Initial points
                */
                var x = _x - begintime * FREQUENCY * cellSize;
                var y = _y + ECGContainer.HEIGHT - squareSize/2;
                /*
                *Draw horizontal line
                */
                context.beginPath();
                context.moveTo(_x,y);
                context.lineTo(_x+tapeWidth,y);
                context.stroke();
                /*
                *Draw ticks
                */
                //TODO: REPLACE 6000!
                for (var i = 0; i < 6000; i+=FREQUENCY/2){
                    //TODO: Refactor this block
                    x = _x - begintime * FREQUENCY * cellSize + i*cellSize;
                    if(x > _x+tapeWidth || x < _x){
                        if(i%FREQUENCY == 0){
                            time.setSeconds(time.getSeconds() + 1);
                        }
                        continue;
                    }
                    
                    context.beginPath();
                    context.moveTo(x, y);
                    context.lineTo(x, y - squareSize / 4); //draw subtick
                    context.stroke();
                    /*
                    *format time like "00m:00s" and print it
                    */
                    context.font = '8pt sans-serif';
                    if(i%FREQUENCY == 0){
                        context.strokeText(('0'+time.getMinutes()).slice(-2)+":"+('0'+time.getSeconds()).slice(-2), x+cellSize, y-cellSize);
                        /*
                        *increment time by 1 second
                        */
                        time.setSeconds(time.getSeconds() + 1);
                    }
            }
        }

        ECGContainer.AMOUNT++;
        this.offset = (ECGContainer.AMOUNT - 1) * tapeWidth;
    }
    /*
    *Amount of created containers 
    */
    ECGContainer.AMOUNT = 0;
    /*
    *As all containers has the same height,
    *we will use class property to keep it
    */
    ECGContainer.HEIGHT = 0;
    /*
    *Prototype
    */
    ECGContainer.prototype = {
        constructor: ECGContainer,
        /*
        *Method provides adding new tapes to container
        */
        pushTape: function(signal){
            this.tapes.push(new ECGTape(signal));
            this.tapesAmount++;
            ECGContainer.HEIGHT = this.tapesAmount * ROWS_IN_TAPE * squareSize + squareSize/2;
        },
        /*
        *Checks point belonging to container by x-coord
        */
        containPoint: function(x){
            if(x > this.x && x < this.x + tapeWidth){
                return true;
            }
        },
        /*
        *Redraw all tapes and timeline in container
        */
        redraw: function(x, y, begintime){
            this.x = x
            /*
            *Draw container's borders
            */
            context.lineWidth = 1
            context.strokeStyle = "black"
            context.beginPath()
            context.moveTo(x,y);
            context.lineTo(x,y + ECGContainer.HEIGHT - squareSize/2)
            context.stroke()
            /*
            *Draw tapes
            */
            $.each(this.tapes, function(index, tape){
                tape.redraw(x, y + index*ROWS_IN_TAPE*squareSize, begintime);
            });
            /*
            *Draw timeline
            */
            if(enableTimeline){
                this.drawTimeline(x, y, begintime);
            }
        }
    }
    /*
    *Single ECGTape class
    */
    function ECGTape(signal){
        /*
        *Signal object
        */
        this.signal = signal;
        this.__rows = ROWS_IN_TAPE - 0.5;
        /*
        *x-coord of tape
        */
        this.x;
        /*
        *Array of y-coordinates
        *when we draw copy of tape in new place
        *new y-coord keep in this array
        */
        this.copies =[]
        /*
        *Draw single grid-square
        */
        this.drawSquare = function(_x, _y, row, column){
            var x = _x + column * squareSize;
            var y = _y + row * squareSize;
            var GRID_LINES = 6;
            var lineLength = 0;
            context.lineWidth = 0.5;
            context.strokeStyle = "rgb(255, 0, 0)";
            context.beginPath();
            /*
            *Draw vertical lines
            */
            for (var i = 0; i < GRID_LINES; i++) {
                if(x+i*cellSize < _x+tapeWidth && x + i*cellSize > _x){
                    context.moveTo(x+i*cellSize,y);
                    context.lineTo(x+i*cellSize,y+squareSize)
                }
            }
            /*
            *Draw horizontal lines
            *Firstly, we calculate length of line to 
            *avoid drawing lines out of container's borders
            */
            if(x+squareSize > _x+tapeWidth){
                lineLength =  _x+tapeWidth - x;
            }else if(x < _x && x+squareSize > _x){
                lineLength = x + squareSize - _x;
                x = _x;
            } else if (x < _x && x + squareSize <= _x){
                lineLength = 0
            } else {
                lineLength = squareSize
            }

            for(var i = 0; i < GRID_LINES; i++){
                context.moveTo(x,y+i*cellSize);
                context.lineTo(x+lineLength,y+i*cellSize)
            }
            context.stroke();
        }
        /*
        *Draw grid of tape
        */
        this.drawGrid = function(x, y, begintime){
            /*
            *Translate begintime to pixels
            */
            var time = -begintime * FREQUENCY * cellSize
            var leftColumn = time / squareSize
            var rightColumn = tapeWidth / squareSize
            for (var row = 0; row < this.__rows; row++) {
                for (var column = leftColumn; column < rightColumn; column++) {
                    this.drawSquare(x, y, row, column)
                }
            }
        };  
        /*
        *Signal drawing function
        */
        this.drawSignal = function(_x, _y, begintime) {        
            var y_base = _y + squareSize * 3;
            /*
            *Pixels to draw 1 microvolt
            */
            var PX_PER_MCV = CALIBRATION * cellSize / 1000.0;
            /*
            *Set initial points to rendering 
            */
            var x = _x - begintime * FREQUENCY * cellSize;
            /*
            *Why do we substract value, not add?
            */
            var y = y_base - this.signal.data[0] * PX_PER_MCV;

            context.lineWidth = 2;
            context.strokeStyle = "blue";
            context.beginPath();
            context.moveTo(x, y);

            for (var i = 0; i < this.signal.data.length;i++) {  
                x += 2 * squareSize / SAMPLING_FREQUENCY;
                /*
                *To not draw a signal outside the 
                *Beside, this block provide more productivity. (drawing is faster)
                */
                if(x < _x+tapeWidth && x > _x){
                    y = y_base- this.signal.data[i] * PX_PER_MCV
                    context.lineTo(x, y)
                } else {
                    context.moveTo(x,y)
                }
            }
            context.stroke();
            /*
            *Render descriptions, annotations and other information
            *from channel
            */    
            context.strokeStyle = "black";
            context.font = '12pt Times-new-roman';
            context.strokeText(this.signal.name, _x + 10, _y + squareSize);
            if(enableDescriptions){
                context.strokeText(this.signal.description, tapeWidth - squareSize * 8, _y + squareSize);
            }
        };
        /*
        *This method returns time formatted 00m:00s:000ms
        *@position - x_position on canvas
        */
        this.getTime = function(position){
            var time = new Date(0);
            var MSEC_IN_SEC = 1000;
            //TODO: DELETE gridOrigin.x!
            time.setMilliseconds((position-gridOrigin.x- this.x)/cellSize/FREQUENCY*MSEC_IN_SEC)
            return ('0'+time.getMinutes()).slice(-2)+":"+('0'+time.getSeconds()).slice(-2)+":"+('00'+time.getMilliseconds()).slice(-3)
        }
        /*
        *Overlays
        */
        this.drawAnnotations = function(offset, y ){
            var annotations = this.signal.annotation_data;
            var x = this.x;
            if(annotations != undefined){
                $.each(annotations, function(index, annotation){
                    var ms = parseFloat(annotation.time.slice(-3));
                    if(ms === NaN){
                        throw new Error("Parsing annotation time(msec) error");
                    }
                    var s = parseFloat(annotation.time.slice(6,8));
                    if(s === NaN){
                         throw new Error("Parsing annotation time(sec) error");
                    }
                    var m = parseFloat(annotation.time.slice(3,5));
                    if(m === NaN){
                         throw new Error("Parsing annotation time(m) error");
                    }
                    var h = parseFloat(annotation.time.slice(0,2));
                    if(h === NaN){
                         throw new Error("Parsing annotation time(h) error");
                    }
                    var time = ms/1000 + s + m * 60 + h * 3600;  
                    /*
                    *Translate time to pixels
                    */
                    var position =  (-offset + time) * FREQUENCY * cellSize
                    context.strokeStyle = "black";
                    context.font = '11pt Arial';
                    if(position > x && position < x + tapeWidth){
                        context.strokeText(annotation.label,position, y + 3*squareSize);
                    }
                });
            }
        }
    }
    ECGTape.prototype = {
        constructor: ECGTape,
        /*
        *Draw tape's borders
        *e.g when tape is selected
        */
        stroke: function(copy){
            context.strokeStyle = "orange";
            context.lineWidth = 3;
            context.beginPath();
            context.moveTo(this.x, this.copies[copy]);
            context.lineTo(this.x+tapeWidth, this.copies[copy]);
            context.lineTo(this.x+tapeWidth,this.copies[copy] + squareSize*6)
            context.lineTo(this.x, this.copies[copy] +  squareSize * 6);
            context.closePath();
            context.stroke();
        },
        /*
        *Draw selection on the tape
        *@param copy - number of copy of selected tape
        *@param start - begin time of selection
        *@param end - end time of selection
        *@return object { 
        *                  begin - time 00m:00s:000ms
        *                  end - time 00m:00s:000ms
        *               }
        */
        selectArea: function(copy, start, end){
            /*
            *TODO: this value shold control in painter class, not here
            */
            var gridOffset = 10;
            /*
            *Swap end and start if it's necessary
            */
            if(end < start){
                var temp = start;
                start = end;
                end = temp;
            }
            /*
            *Draw selection
            */
            context.strokeStyle = "blue";
            context.globalAlpha = 0.3;
            context.fillRect(start - gridOffset, this.copies[copy], end - start, squareSize * 6);
            context.globalAlpha = 1;
          
            return  {
                        begin: this.getTime(start - gridOffset),
                        end: this.getTime(end - gridOffset)
                    };
           
        },
        /*
        *Check point belonging to tape
        *@param x - abscissa of sought-for point
        *@param y - ordinate of sought-for point
        *@return -1 if none of this tape's copies contains sought-for point
        *@return number of copy that contains sought-for point
        */
        containPoint: function(x, y){
            var tapePosition = -1;
            if(x > this.x && x < this.x + tapeWidth){
                $.each(this.copies,function(index, value){
                    if(y > value && y < value + squareSize * 6){
                        tapePosition = index;
                    }
                });
            }
            return tapePosition;
        
        },
        /*
        *Allow to get signal value by time
        */
        getSignalValue: function(copy, time){
            var position = Math.ceil(time*FREQUENCY*SAMPLING_FREQUENCY/10);
            return this.signal.data[position];
        },
        /*
        *Redraw the tape
        *@param -begintime - seconds from tape's start
        */
        redraw: function(x, y, begintime){
            this.x = x;
            if(-1 === $.inArray(y, this.copies)){
                this.copies.push(y);
            }
            this.drawGrid(x, y, begintime);
            this.drawSignal(x, y, begintime);
            if(annotations){
                try{
                    this.drawAnnotations(begintime , y);
                } catch(e){
                    //TODO: Maybe do some logs
                }
            }
        }
    }
    /*
    *Constants-block
    */
    var ROWS_IN_TAPE = 6.5;
    var FREQUENCY = 25; /*mm per sec*/
    var SAMPLING_FREQUENCY = 50; /*dots per centimeter*/
    var CALIBRATION = 10; /* mm per millivolt */
    /*
    *Variables-block
    */
    /*
     *Graphic 2d context
    */
    var canvas;
    var context;
    // 1mm cell
    var cellSize = get_px_in_mm();
    // 5mm square
    var squareSize = 5 * cellSize;

    

    var signalLength = 0;
    /*
    *Viewer's configuration
    */
    var numberOfChannels;
    var tableColumns;
    var tapeWidth;
    var multiline;
    var lines;
    var enableTimeline;
    var enableDescriptions;
    var annotations;
    /*
    *Last selected tape and its copy-number
    */
    var selectedTape;
    var selectedTapeCopy;
    // Reg grid geometry
    var gridOrigin = {
        x: 0
    }
    var containers = [];
    /*
    *Vatiables for mouse and touch events
    */
    var dragging = false;
    var selecting = false;
    var tapePosition = 0;
    var lastX = 0;
    var startMoving;
    var endMoving;
    /*
    *This closure provide creating canvas
    *and getting graphic context
    */
    (function(){
        canvas = $('<canvas/>')
        $("body").append(canvas);
        /*Because getContext('2d') works on DOM element,
        where var canvas = $('#myCanvas'); return a jQuery object but not a DOM element.
        And to retrieve a DOM element (here, caм nvas element) 
        from jQuery object you need to use canvas[0].*/
        context = canvas[0].getContext('2d');
    })();
    /*
    *Updating viewer geometry
    *Now it's called just when viewer's configuration was changed
    */
    function updateGeometry(){
        /*
        *Resize canvas according to number of channels, columns(for tableview) and width of tape
        */
        context.canvas.height = ROWS_IN_TAPE * squareSize * Math.ceil(numberOfChannels / tableColumns);   
        context.canvas.height *= lines;
        context.canvas.height += squareSize * lines;

        context.canvas.width = tableColumns * tapeWidth;

        context.clearRect(0,0,context.canvas.width, context.canvas.height)
        /*
        *Create containers according to columns from configuration
        */
        for(var i = 0; i < tableColumns; i++){
            containers.push(new ECGContainer());
        }
    }
    /*
    *Events' handlers
    *provide scrolling tapes, select specific tape etc.
    */
    $(context.canvas).on("mousedown", function(e){
        if(selectedTape != undefined){
            if(-1 != selectedTape.containPoint(e.pageX, e.pageY)){
                selecting = true;
                startMoving = e.pageX;                      
            }
        }
        if(selectedTape === undefined){
            dragging = true;
            lastX = e.pageX;
        }
    });
    $(window).on("mousemove", function(e){
        if(dragging){
            var delta = e.pageX - lastX;
            tapePosition = Math.min(tapePosition +  delta, 0)
            gridOrigin.x = tapePosition;
            lastX = e.pageX;
            redraw();  // redraw
        }
        if(selecting){
            if(-1 != selectedTape.containPoint(e.pageX, e.pageY)){
                endMoving = e.pageX;
                redraw();
            }
        }
    });
    $(context.canvas).on("click", function(e){
        if(selectedTape){
            selectedTape.getSignalValue(selectedTapeCopy, (selectedTapeCopy * tapeWidth-gridOrigin.x + e.pageX)/(cellSize*FREQUENCY));
        }
    });
    $(window).on("mouseup", function(e){
      dragging = false;
      selecting = false;
      lastX = 0;
      startMoving = 0;
      endMoving = 0;
    })
    context.canvas.onwheel = function(e){
        if(selectedTape === undefined){
            var evt = e || event;
            var delta = e.deltaY || e.detail || e.wheelDelta;
            tapePosition = Math.min(tapePosition -  delta, 0);
            gridOrigin.x = 0 + tapePosition;
            redraw();
        }
    }
    /*
    *Handler to provide double-clicking on specific tape
    *to select this tape for some actions, e.g. selecting area or comment signal
    */
    $(context.canvas).on('dblclick' , function(e){
        $.each(containers, function(index, container){
            if(container.containPoint(e.pageX)){
                $.each(container.tapes, function(i, tape){
                    var copy;
                    if(-1 != (copy = tape.containPoint(e.pageX, e.pageY))){
                            if(tape === selectedTape){
                                if(selectedTapeCopy === copy){
                                    selectedTape = undefined;
                                    redraw();
                                } else {
                                    selectedTapeCopy = copy;
                                    redraw();
                                }
                            } else {
                                selectedTape = tape;
                                selectedTapeCopy = copy;
                                redraw();
                            }
                    }
                });
            }
        });
    })
    /*
    *Redraw all viewer
    */
    function redraw(){
        context.clearRect(-0,0,context.canvas.width, context.canvas.height)
        /*
        *Draw containers
        */
        for(var i  = 0; i < lines; i++){
            $.each(containers, function(index, container){
                container.redraw(
                        index*tapeWidth, 
                        i * ECGContainer.HEIGHT, 
                        (i * tapeWidth-gridOrigin.x)/(cellSize*FREQUENCY)
                    );
            });
        }
        /*
        *Select area on the chosen tape
        */
        if(selectedTape != undefined){
            selectedTape.stroke(selectedTapeCopy);
            selectedTape.selectArea(selectedTapeCopy, startMoving, endMoving);
        }
    }
    
    /*
    *This function converts 1 px to 1mm 
    *Unfortunately, it works only in desktop browsers
    *To draw signal as accurate as possible on mobile devices, e.g.
    *you shoud add <meta name="viewport" content="width=device-width">
    *to your .html.
    */
    function get_px_in_mm(){
        $("body").append("<div id='conv_block' style='width:1mm;height:1mm;display:hidden;'></div>");
        var pixels = $("#conv_block").width();
        $("#conv_block").remove();
        return pixels;
    }
      /*
    ************API**************
    *Set new confiuration to viewer
    *@param config - json
    *TODO: Description of configuration object
    */
    this.setConfig = function(config){
        numberOfChannels = config.numberOfChannels;
        tableColumns = config.tableColumns;
        multiline = config.multiline;
        lines = config.lines;
        enableTimeline = config.timeline;
        enableDescriptions = config.enableDescriptions;
        tapeWidth = config.tapeWidth;
        annotations = config.annotations;

        updateGeometry();
    }
    /*
    ************API**************
    *Adding new lead to viewer.
    *Leads are placed into containers according to the lead's index
    */
    this.pushLead = function(lead, index){
        containers[index%tableColumns].pushTape(lead);
    }
    /*
    ************API**************
    *Re-draw viewer
    */
    this.redraw = function(){
        redraw();
    }
}
/*
*Next code runs after DOM' loading
*It's just for tests
*/
$(function(){
    /*
    *Configuration of ECG component
    */
    getSignal(function(data){
      var painterConfig = {
            numberOfChannels: data.channels.length,
            tableColumns: 3,
            tapeWidth: 200,
            enableDescriptions: true,
            lines: 2,
            timeline: true,
            annotations: true
      };

      var viewer = new ECGPainter();
      viewer.setConfig(painterConfig);

      $.each(data.channels, function(ind, obj){
            viewer.pushLead(obj, ind);
      });
  
      viewer.redraw();
    });
    
});
function getSignal(callback){
	$.ajax({
    	url:'./data.json',
    	type: "GET",
    	dataType: "json",
    	success: function(result){
            callback(result);
    	}
    });
}
