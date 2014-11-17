/*
*Next code runs after DOM' loading
*It's just for tests
*/
$(function(){
    $('#test').ECGViewer({
        numberOfChannels: 6, /* num */
        tableColumns: 3,        /* num */
        tapeWidth: 200,         /* px */
        lines: 2,               /* num */
        timeline: true,         /* bool */
        annotations: true,      /* bool */
        dimension: false,       /* bool */
        /* 
        *Example of tape's selection hanlers. 
        *Now it's called when user make long tap over selection. 
        *@param interval - object { 
        *                      begin - Date object
        *                      end - Date object
        *                  }
        */
        selectTapeHandler: function(interval){
            alert(JSON.stringify(interval));  
        },
        /* 
        *Example of signal's selection hanlers. 
        *TODO! 
        */ 
        selectSignalHandler: function(values){
            alert(values);
        }
    });
    getSignal(function(data){
        $('#test').ECGViewer('setConfig',{
            numberOfChannels: data.channels.length 
        });
        $.each(data.channels, function(ind, obj){
            $('#test').ECGViewer('pushLead', ind, obj);
        });
  
        $('#test').ECGViewer('redraw');
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