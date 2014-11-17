ecgviewer.jquery.js

ECGViewer plugin for jquery

initialization:
$('#test').ECGViewer({/*viewer's configuration*/})

Public methods:

pushLead(index, object), where index is lead's index and object is json-data
setConfig(config), where config is js object with viewer's configuration
redraw(), to redraw all viewer

To call method:

$('#test').ECGViewer('methoname', args...)

Current version of viewer's configuration object:
    {
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
        selectTapeHandler: function(interval){},
    }
