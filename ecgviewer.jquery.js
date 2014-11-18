/*
*Double tap event
*
*/
(function($){ 
    $.event.special.doubletap = {
        bindType: 'touchend',
        delegateType: 'touchend',
     
        handle: function(event) {
            var handleObj   = event.handleObj,
                targetData  = jQuery.data(event.target),
                now         = new Date().getTime(),
                delta       = targetData.lastTouch ? now - targetData.lastTouch : 0,
                delay       = delay == null ? 300 : delay;
     
            if (delta < delay && delta > 30) {
                targetData.lastTouch = null;
                event.type = handleObj.origType;
                ['pageX', 'clientY', 'pageX', 'pageY'].forEach(function(property) {
                event[property] = event.originalEvent.changedTouches[0][property];
            })
 
                // let jQuery handle the triggering of "doubletap" event handlers
                handleObj.handler.apply(this, arguments);
            } else {
                targetData.lastTouch = now;
            }
        }
    };
})(jQuery);
(function( $ ){
     /*
    *Union of several ECGTapes
    *It provides drawing of ECG component according to table- or multiline-parameteres
    *Every ECGBlock has own borders and settings.timeline
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
        *Draw settings.timeline
        */
        this.drawTimeline = function(_x, _y, begintime){
                var time = new Date(0,0,0,0,0,0,0);

                context.lineWidth = 1;
                context.strokeStyle = "black";
                /*
                *Initial points
                */
                var x = _x - begintime * PX_FREQUENCY;
                var y = _y + ECGContainer.HEIGHT - squareSize/2;
                /*
                *Draw horizontal line
                */
                context.beginPath();
                context.moveTo(_x,y);
                context.lineTo(_x+settings.tapeWidth,y);

                //time.setSeconds(Math.ceil(begintime));
                /*
                *Draw ticks
                */
                for (var i = 0; x <= _x+settings.tapeWidth; i+=FREQUENCY/2){
                    x = _x - begintime * PX_FREQUENCY + i*cellSize;
                    if(x > _x+settings.tapeWidth || x < _x){
                        if(i%FREQUENCY == 0){
                            time.setSeconds(time.getSeconds() + 1);
                        }
                        continue;
                    }
                
                    context.moveTo(x, y);
                    context.lineTo(x, y - squareSize / 4); //draw subtick

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
            context.stroke();
        }

        ECGContainer.AMOUNT++;
        this.offset = (ECGContainer.AMOUNT - 1) * settings.tapeWidth;
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
            if(x > this.x && x < this.x + settings.tapeWidth){
                return true;
            }
        },
        /*
        *Redraw all tapes and settings.timeline in container
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
            if(settings.timeline){
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
       
        /*
        *Draw grid of tape
        */
        this.drawGrid = function(x, y, begintime){
            context.drawImage(buffer, x,y);
        };  
        /*
        *Signal drawing function
        */
        this.drawSignal = function(_x, _y, begintime) {        
            var y_base = _y + squareSize * 3;
            
            /*
            *Set initial points to rendering 
            */
            var x = _x //- begintime * PX_FREQUENCY;
            /*
            *Why do we substract value, not add?
            */
            var startValue = Math.floor(begintime * DOTS_PER_SEC);
            var y = y_base - this.signal.data[startValue] * PX_PER_MCV;
            var step = 1;
            context.lineWidth = 2;
            context.strokeStyle = "blue";
            context.beginPath();
            context.moveTo(x, y);
            /*
            *Make decimation of signal to provide more performance
            */
            if(resamling){
                startValue += decimation_ratio - (startValue % decimation_ratio);
                step = decimation_ratio;
            }

            for (var i = startValue; i < this.signal.data.length;i+=step) {  
                 x += MM_TO_DOTS * step;
                /*
                *To not draw a signal outside the 
                *Beside, this block provide more productivity. (drawing is faster)
                */
                if(x < _x+settings.tapeWidth){
                    y = y_base - this.signal.data[i] * PX_PER_MCV
                    context.lineTo(x, y)
                } else {
                    context.moveTo(x,y)
                }
            }
            context.stroke();
        };
        this.drawDescriptions = function(_x, _y){
            /*
            *Render descriptions, settings.annotations and other information
            *from channel
            */    
            context.strokeStyle = "black";
            context.font = '12pt Times-new-roman';
            context.strokeText(this.signal.name, _x + 10, _y + squareSize);
            if(settings.dimension){
                context.strokeText(FREQUENCY.toString()+" mm/sec, "+CALIBRATION.toString()+ " mm/mV", this.x+settings.tapeWidth - squareSize * 8, _y + squareSize);
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
            return time;
        };
        /*
        *Overlays
        */
        this.drawAnnotations = function(offset, y ){
            var annotations = this.signal.annotation_data,
                x = this.x,
                position;

            if(settings.annotations != undefined){
                $.each(annotations, function(index, annotation){
                    var ms = parseFloat(annotation.time.slice(-3));
                    if(isNaN(ms)){
                        throw new Error("Parsing annotation time(msec) error");
                    }
                    var s = parseFloat(annotation.time.slice(6,8));
                    if(isNaN(s)){
                         throw new Error("Parsing annotation time(sec) error");
                    }
                    var m = parseFloat(annotation.time.slice(3,5));
                    if(isNaN(m)){
                         throw new Error("Parsing annotation time(m) error");
                    }
                    var h = parseFloat(annotation.time.slice(0,2));
                    if(isNaN(h)){
                         throw new Error("Parsing annotation time(h) error");
                    }
                    var time = ms/1000 + s + m * 60 + h * 3600;  
                    /*
                    *Translate time to pixels
                    */
                    position =  (time - offset) * PX_FREQUENCY
                    
                    context.strokeStyle = "black";
                    context.font = '11pt Arial';
                    if(position > x && position < x + settings.tapeWidth){
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
            context.lineTo(this.x+settings.tapeWidth, this.copies[copy]);
            context.lineTo(this.x+settings.tapeWidth,this.copies[copy] + squareSize*6)
            context.lineTo(this.x, this.copies[copy] +  squareSize * 6);
            context.closePath();
            context.stroke();
        },
        selectSignal: function(copy, x, y){
            var radius = cellSize,
                signalPos = Math.floor((x - this.x -gridOrigin.x+ settings.tapeWidth*copy) / cellSize / 10 * SAMPLE_RATE),
             
                y_base = this.copies[copy] + squareSize * 3,
                _x,
                _y;
            if(this.signal.data[signalPos] != null){
                _x = x;
                _y = y_base - this.signal.data[signalPos] * PX_PER_MCV
            }
            context.strokeStyle = "green";
            context.lineWidth = 2
            context.beginPath();
            context.arc(_x, _y, radius, 0, 2 * Math.PI);
            context.stroke();
        },
        /*
        *Draw selection on the tape
        *@param copy - number of copy of selected tape
        *@param start - begin time of selection
        *@param end - end time of selection
        *@return object { 
        *                  begin - Date object
        *                  end - Date object
        *               }
        */
        selectArea: function(copy, start, end){
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
            context.fillRect(start, this.copies[copy], end - start, squareSize * 6);
            context.globalAlpha = 1;
          
            return  {
                        begin: this.getTime(copy*tapeWidth+start),
                        end: this.getTime(copy*tapeWidth+end)
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
            if(x > this.x && x < this.x + settings.tapeWidth){
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
            var position = Math.ceil(time*DOTS_PER_SEC);
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
            if(settings.annotations){
                try{
                    this.drawsettings.annotations(begintime , y);
                } catch(e){
                    //TODO: Maybe do some logs
                }
            }
            this.drawDescriptions(x, y);
        }
    }
    /*
    *Temporary buffer for ecg_grid
    */
    var buffer  = document.createElement("canvas");
    /*
    *Temporary buffer for single grid's square
    */
    var squareBuffer = document.createElement("canvas");
    /*
    *Constants-block
    */
    var ROWS_IN_TAPE = 6.5; /* 6 ROWS + 0.5 square for settings.timeline */
    var FREQUENCY = 25; /* mm per sec */
    var SAMPLE_RATE = 50; /* dots per centimeter */
    var CALIBRATION = 10; /* mm per millivolt */
    /*
    *Variables-block
    */
    var canvas; /* The main canvas */
    var context; /* and its graphic context */
    
    var cellSize; /* 1mm cell */
    var squareSize;/* 5mm square */

    var PX_FREQUENCY = FREQUENCY * cellSize;
    
    var PX_PER_MCV; /* Pixels to draw 1 microvolt */
    var DOTS_PER_SEC; /* signal's dots per 1 sec */
    var MM_TO_DOTS; /* mm to signal's dots translating */
    var resamling = false; /* Flag to provide using resampling or not */
    var decimation_ratio = 10; /* Ratio of signal's decimation (if resampling is turned on) */
    // Reg grid geometry
    var gridOrigin = {
        x: 0
    };
    var containers = []; /* Array of ecg containers */
    /*
    *Vatiables for mouse and touch events
    */
    var startTouch; /* time */
    var tapEvent; /* to detect single tap event*/
    var scrolling = false; /* to detect scrolling viewer */
    var selecting = false; /* to detect selecting single tape */
    var tapePosition = 0; 
    var lastX = 0;
    var startMoving; /* to provide selecting single tape */
    var endMoving; /* to provide selecting single tape */
    var longTapDetect = false; /* flag to detect a long tap event */
    /*
    *Selection variables
    */
    var selectedTape;         /* Last selected tape  */
    var selectedTapeCopy;     /* and its copy's number */
    var selectedArea;         /* object of selected tape borders */
    var selectedSignalArray;  /* array of selected signal dots */
    var selectTapeCallback;   /* function */
    var selectSignalCallback; /* function */
  
    /*
    *Updating viewer geometry
    *Now it's called just when viewer's configuration was changed
    */
/*
    *Draw single grid square
    *to provide more performance
    */
    function drawSquareBuffer(){
        var GRID_LINES = 6;
        var x = 0;
        var y = 0;
        
        squareBuffer.width = squareSize;
        squareBuffer.height = squareSize;
        var ctx = squareBuffer.getContext('2d');
       
        ctx.lineWidth = 0.5;
        ctx.strokeStyle = "rgb(255, 0, 0)";
        
        ctx.beginPath();
        for (var i = 0; i < GRID_LINES; i++) {
                ctx.moveTo(x+i*cellSize,y);
                ctx.lineTo(x+i*cellSize,y+squareSize)
                ctx.moveTo(x,y+i*cellSize);
                ctx.lineTo(x+squareSize,y+i*cellSize)
        }

        ctx.lineWidth = 0.7;
        ctx.moveTo(x,y)
        ctx.lineTo(x + squareSize, y);
        ctx.lineTo(x + squareSize, y + squareSize);
        ctx.lineTo(x, y + squareSize);
        ctx.closePath();
        ctx.stroke();
    }
    function drawECGGrid(begintime){
        buffer.width = settings.tapeWidth;
        buffer.height = 6 * squareSize;
        buffer.ctx = buffer.getContext('2d');
        /*
        *Translate begintime to pixels
        */
        var time = -(begintime) * PX_FREQUENCY
        var leftColumn = time / squareSize
        var rightColumn = settings.tapeWidth / squareSize
        leftColumn = leftColumn-Math.ceil(leftColumn)
        for (var row = 0; row < Math.floor(ROWS_IN_TAPE); row++) {
            for (var column = leftColumn; column < rightColumn; column++) {
                drawSquare(row, column, buffer.ctx)
            }
        }
    }
    function drawSquare(row, column, bufctx){
        var x = column * squareSize;
        var y = row * squareSize;

        bufctx.drawImage(squareBuffer,x,y);     
    }
    function updateViewer(){
        cellSize = get_px_in_mm(); /* 1mm cell */
        squareSize = 5 * cellSize;
        PX_FREQUENCY = FREQUENCY * cellSize;
        PX_PER_MCV = CALIBRATION * cellSize / 1000.0; /* Pixels to draw 1 microvolt */
        DOTS_PER_SEC = FREQUENCY * SAMPLE_RATE / 10; /* signal's dots per 1 sec */
        MM_TO_DOTS = 2 * squareSize / SAMPLE_RATE; /* mm to signal's dots translating */
        /*
        *Resize canvas according to number of channels, columns(for tableview) and width of tape
        */
        context.canvas.height = ROWS_IN_TAPE * squareSize * Math.ceil(settings.numberOfChannels / settings.tableColumns);   
        context.canvas.height *= settings.lines;
        context.canvas.height += squareSize * settings.lines;

        context.canvas.width = settings.tableColumns * settings.tapeWidth;

        context.clearRect(0,0,context.canvas.width, context.canvas.height)
        /*
        *Create containers according to columns from configuration
        */
        for(var i = 0; i < settings.tableColumns; i++){
            containers.push(new ECGContainer());
        }

        drawSquareBuffer()
    }
    /*
    *Redraw all viewer
    */
    function redraw(){
        /*
        *Draw containers
        */
        if(selectedTape === undefined){
            context.clearRect(0,
                            0,
                            context.canvas.width, 
                            context.canvas.height)
            for(var i  = 0; i < settings.lines; i++){
                drawECGGrid((i * settings.tapeWidth-gridOrigin.x)/(cellSize*FREQUENCY));
                $.each(containers, function(index, container){
                    container.redraw(
                            index*settings.tapeWidth, 
                            i * ECGContainer.HEIGHT, 
                            (i * settings.tapeWidth-gridOrigin.x)/(cellSize*FREQUENCY)
                        );
                });
            }
        }
        /*
        *Select area on the chosen tape
        */
        if(selectedTape != undefined){
            drawECGGrid((selectedTapeCopy * settings.tapeWidth - gridOrigin.x)/(cellSize*FREQUENCY));
            context.clearRect(selectedTape.x, selectedTape.copies[selectedTapeCopy], settings.tapeWidth, 6 * squareSize)
            selectedTape.redraw(
                    selectedTape.x,
                    selectedTape.copies[selectedTapeCopy],
                    (selectedTapeCopy * settings.tapeWidth-gridOrigin.x)/(cellSize*FREQUENCY));
            selectedTape.stroke(selectedTapeCopy);
            selectedArea = selectedTape.selectArea(selectedTapeCopy, startMoving, endMoving);
        }
    }
     /*
    *Provide Long tap event' handling
    */ 
    function longTap(event){
        if(selectedArea != undefined){
            if(settings.selectTapeHandler != undefined){
                settings.selectTapeHandler(selectedArea);
            }
        }
    }
    /*
    *Provide quick single tap
    */
    function singleTap(event){
        var e = event || tapEvent,
            copy;
        if(selectedTape != undefined){
            if(selectedTapeCopy === (copy = selectedTape.containPoint(e.pageX, e.pageY))){
                selectedTape.selectSignal(copy, e.pageX, e.pageY, (-gridOrigin.x)/(cellSize*FREQUENCY))
            }
        }
    }
    /*
    *General handlers
    */
    function onMouseDown(x, y){
        if(selectedTape != undefined){
            if(-1 != selectedTape.containPoint(x, y)){
                selecting = true;
                startMoving = x;                      
            }
        }
        if(selectedTape === undefined){
            scrolling = true;
            resamling = true;
            lastX = x;
        }
    }
    function onMouseUp(){
        if(scrolling){
            scrolling = false;
            resamling = false;
            redraw();
        } 
        if(selecting){
            selecting = false;
            lastX = 0;
            startMoving = 0;
            endMoving = 0;
        }
    }
    function onMove(x, y){
        if(scrolling){
            var delta = x - lastX;

            tapePosition = Math.min(tapePosition +  delta, 0)
            gridOrigin.x = tapePosition;
            lastX = x;
            redraw();  // redraw
        }
        if(selecting){
            if(-1 != selectedTape.containPoint(x, y)){
                endMoving = x;
                redraw();
            }
        }
    }
    function onSelectTape(x, y){
        var copy;
        
        selectedArea = undefined;

        $.each(containers, function(index, container){
            if(container.containPoint(x)){
                $.each(container.tapes, function(i, tape){
                    if(-1 != (copy = tape.containPoint(x, y))){
                        if(tape === selectedTape){
                            if(selectedTapeCopy === copy){
                                selectedTape = undefined;
                                redraw();
                            } else {
                                selectedTape = undefined;
                                redraw();
                                selectedTape = tape;
                                selectedTapeCopy = copy;
                                redraw();
                            }
                        } else {
                            selectedTape = undefined;
                            redraw();
                            selectedTape = tape;
                            selectedTapeCopy = copy;
                            redraw();
                        }
                    }
                });
            }
        });
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
    *Viewer's configuration
    */
    var settings = {
        numberOfChannels: 1, /* num */
        tableColumns: 1,        /* num */
        tapeWidth: 200,         /* px */
        lines: 1,               /* num */
        timeline: true,         /* bool */
        annotations: true,      /* bool */
        dimension: false,       /* bool */
        selectTapeHandler: undefined,
        selectSignalHandler: undefined
    };
    /*
    *Public methods
    */
    var methods = {
        init: function( options ) {
            settings = $.extend(settings, options);
            
            return this.each(function(){
                canvas = $('<canvas/>')
                context = canvas[0].getContext('2d');
                updateViewer();
                $(this).append(canvas);
                 /*
                *Events' handlers
                *provide scrolling tapes, select specific tape etc.
                */
                /*
                *Mouse handlers
                */
                $(this).on("mousedown", function(e){
                    onMouseDown(e.pageX,e.pageY)
                });
                $(window).on("mousemove", function(e){
                    onMove(e.pageX, e.pageY);
                });
                $(this).on("click", function(e){
                   singleTap(e);
                });
                $(window).on("mouseup", function(e){
                  onMouseUp();
                })
                /*
                *Handler to provide double-clicking/double-tapping on specific tape
                *to select this tape for some actions, e.g. selecting area or comment signal
                */
                $(this).on('dblclick doubletap', function(e){
                    onSelectTape(e.pageX, e.pageY);
                });
                /*
                *Touch handlers
                */
                $(this).on('touchstart',function(event){
                    event.preventDefault();
                    event.stopPropagation();

                    var e = event.originalEvent;
                    var touch = e.targetTouches[0];

                    startTouch = new Date();
                    tapEvent = touch;
                    longTapDetect = true;
                    /*Long tap detect*/
                    setTimeout(function(){
                        if(longTapDetect){
                            longTap(touch);
                        }
                    }, 300);
                    onMouseDown(touch.pageX, touch.pageY);
                });
                $(this).on('touchmove', function(event){
                    event.preventDefault();
                    event.stopPropagation();


                    var e = event.originalEvent;
                    var touch = e.targetTouches[0];
                    longTapDetect = false;

                    onMove(touch.pageX, touch.pageY);
                });
                $(this).on('touchend', function(event){
                    event.preventDefault();
                    event.stopPropagation();

                    var e = event.originalEvent;
                    var touch = e.targetTouches[0];
                    longTapDetect = false;
                    var touchTime = new Date().getMilliseconds() - startTouch.getMilliseconds();
                    /* Single tap detect */
                    if(touchTime < 100){
                        singleTap();
                    } 
                    onMouseUp();
                }); 
            });
        },
        /*
        *Adding new lead to viewer.
        *Leads are placed into containers according to the lead's index
        */
        pushLead: function(index, lead){
            containers[index%settings.tableColumns].pushTape(lead);
            return this;
        },
        /*
        *Set new confiuration to viewer
        *@param config - json
        *TODO: Description of configuration object
        */
        setConfig: function(options){
            settings = $.extend(settings, options);
            updateViewer();
            return this;
        },
         /*
        *Re-draw viewer
        */
        redraw: function(){
            redraw();
            return this;
        }
    };
    /*
    *Declare jQuery plugin "ECGViewer"
    */
    $.fn.ECGViewer = function( method ){
        /*
        *If method exists, call it
        */
        if ( methods[method] ) {
            return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
        } 
        /*
        *Call init-method
        */
        else if ( typeof method === 'object' || ! method ) {
            return methods.init.apply( this, arguments );
        } else {
            $.error( 'Method "' +  method + '" doesn\'t exists for jQuery.tooltip' );
        } 
    };
}(jQuery) );
