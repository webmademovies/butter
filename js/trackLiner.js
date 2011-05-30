(function() {
  //<script src="http://code.jquery.com/jquery-1.5.js"></script>
  //<script src="http://ajax.googleapis.com/ajax/libs/jqueryui/1.7.2/jquery-ui.js"></script>
  var TrackLiner = this.TrackLiner = function( elementId ) {

    var tracks = {},
        trackCount = 0,
        eventCount = 0,
        parent = document.createElement( "div" ),
        container = document.createElement( "div" ),
        self = this,
        definition = {
          setup: function() {},
          moved: function() {}
        },
        callback = function( event, ui ) {

          var eventElement = ui.helper[ 0 ],
              trackObject = self.getTrack( eventElement.parentNode.id ),
              trackElement = trackObject.getElement(),
              eventObject = trackObject.getTrackEvent( eventElement.id ).event;

          eventElement.style.top = "0px";
          definition.moved( eventObject, eventElement, trackElement );
          //definition.setup( eventObject, eventElement, trackElement );
        };

    document.getElementById( elementId ).appendChild( parent );
    parent.style.height = "100%";
    parent.appendChild( container );

    $( container ).sortable( { containment: "parent", tolerance: 'pointer' } ).droppable( { greedy: true } );

    $( parent ).droppable({
      // this is dropping an event on empty space
      drop: function( event, ui ) {

        if ( ui.draggable[ 0 ].className.indexOf( "ui-draggable" ) > -1 ) {

          var eventId = ui.draggable[ 0 ].id,
              parentId = ui.draggable[ 0 ].parentNode.id;

          self.createTrack().addTrackEvent( self.getTrack( parentId ).removeTrackEvent( eventId ) );
        }
      }
    });

    var Track = function(inc) {

      var trackId = "trackLiner" + trackCount++,
          events = {},
          element = document.createElement( "div" );

      element.style.background = "-moz-linear-gradient(top,  #eee,  #999)";
      element.style.height = "36px";
      element.style.position = "relative";
      element.id = trackId;

      $( element ).droppable( { greedy: true,
        // this is dropping an event on a track
        drop: function( event, ui ) {

          var eventId = ui.draggable[ 0 ].id,
              trackId = this.id,
              parentId = ui.draggable[ 0 ].parentNode.id;

          self.getTrack( trackId ).addTrackEvent( self.getTrack( parentId ).removeTrackEvent( eventId ) );
        }
      });

      this.getElement = function() {

        return element;
      };

      this.createTrackEvent = function( event ) {

        var trackEvent = {},
            eventId = "trackEvent" + eventCount++;
        
        trackEvent.event = event;
        trackEvent.element = document.createElement( "div" );
        trackEvent.element.style.cursor = "move";
        trackEvent.element.style.background = "-moz-linear-gradient(top,  #ff0,  #660)";
        trackEvent.element.style.opacity = "0.5";
        trackEvent.element.style.height = "100%";
        trackEvent.element.style.width = "100px";
        trackEvent.element.style.position = "absolute";
        trackEvent.element.style.top = "0px";
        trackEvent.element.style.left = "0px";
        trackEvent.element.id = eventId;
        //trackEvent.element = element;

        $( trackEvent.element ).draggable( { /*grid: [ 1, 36 ],*/ containment: parent, zIndex: 9001, scroll: true,
          // this is when an event stops being dragged
          stop: callback
        }).resizable( { autoHide: true, containment: "parent", handles: 'e, w', scroll: false,
          stop: callback
        });

        this.addTrackEvent( trackEvent );
        definition.setup( trackEvent.event, trackEvent.element, element );

        return this;
      };

      this.addTrackEvent = function( trackEvent ) {

        events[ trackEvent.element.id ] = trackEvent;
        element.appendChild( trackEvent.element );
        return this;
      };

      this.getTrackEvent = function( id ) {

        return events[ id ];
      };

      this.removeTrackEvent = function( id ) {

        var trackEvent = events[ id ];
        delete events[ id ];
        element.removeChild( trackEvent.element );
        return trackEvent;
      };
      
      

      /*this.length = function() {

        return eventArray.length;
      };*/

      this.toString = function() {

        return trackId;
      };
    };

    this.createTrack = function() {

      //index = ~index || ~trackArray.length;
      var track = new Track();
      container.appendChild( track.getElement() );
      tracks[ track.getElement().id ] = track;//.splice( ~index, 0, track );
      return track;
    };

    this.getTrack = function( id ) {

      return tracks[ id ];
    };

    /*this.length = function() {

      return trackArray.length;
    };*/

    this.addTrack = function( track ) {

      container.appendChild( track.getElement() );
      tracks[ track.getElement().id ] = track;
    };

    this.removeTrack = function( track ) {

      container.removeChild( track.getElement() );
      delete tracks[ track.getElement().id ];
      return track;
    };

    this.plugin = function( def ) {

      definition = def;

    };

    return this;
  };
}());

