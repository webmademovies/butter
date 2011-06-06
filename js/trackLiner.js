(function(window) {
  //<script src="http://code.jquery.com/jquery-1.5.js"></script>
  //<script src="http://ajax.googleapis.com/ajax/libs/jqueryui/1.7.2/jquery-ui.js"></script>

  var plugins = {};

  function addPlugin ( name, def ) {
    def.setup = def.setup || function (){};
    def.moved = def.moved || function (){};
    def.click = def.click || function (){};
    def.dblclick = def.dblclick || function (){};
    def.select = def.select || function (){};
    def.deselect = def.deselect || function (){};
    if ( name ) {
      plugins[name] = def;
    } //if
  } //addPlugin

  var TrackLiner = this.TrackLiner = function( options ) {

    var tracks = {},
        trackCount = 0,
        eventCount = 0,
        userElement,
        dynamicTrackCreation = options.dynamicTrackCreation,
        restrictToKnownPlugins = options.restrictToKnownPlugins,
        duration = options && options.duration ? options.duration.duration : 1,
        scale = options && options.scale ? options.scale : 1,
        parent = document.createElement( "div" ),
        container = document.createElement( "div" ),
        self = this;

    if ( this !== window ) {

      if ( typeof(options) === 'string' ) {
        userElement = document.getElementById(options);
      }
      else {
        userElement = document.getElementById(options.element);
      } //if

      userElement.appendChild( parent );
      parent.style.height = "100%";
      parent.appendChild( container );

      $( container ).sortable( { containment: "parent", tolerance: 'pointer' } ).droppable( { greedy: true } );

      $( parent ).droppable({
        // this is dropping an event on empty space
        drop: function( event, ui ) {
  
          if ( dynamicTrackCreation && ui.draggable[ 0 ].className.indexOf( "ui-draggable" ) > -1 ) {
  
            var eventId = ui.draggable[ 0 ].id,
                type = ui.draggable[ 0 ].getAttribute('data-trackliner-type'),
                parentId = ui.draggable[ 0 ].parentNode.id,
                newTrack = self.createTrack();

            if ( self.getTrack( parentId ) ) {
              newTrack.addTrackEvent( self.getTrack( parentId ).removeTrackEvent( eventId ) );
            } else {
              var clientRects = parent.getClientRects();
              newTrack.createTrackEvent( type, { left: (event.clientX - clientRects[0].left)/scale }, event, ui );
            } //if

          } //if
        }
      });

      this.createTrack = function( name ) {

        //index = ~index || ~trackArray.length;
        var track = new Track(),
            element = track.getElement();
        
        container.appendChild( element );

        if ( name ) {
          var titleElement = document.createElement('span');
          titleElement.style.postion = 'absolute';
          titleElement.style.left = '5px';
          titleElement.style.top = '50%';
          titleElement.innerHTML = name;
          titleElement.className = 'track-title';
          
          element.appendChild( titleElement );
        } //if

        tracks[ track.getElement().id ] = track;//.splice( ~index, 0, track );
        return track;
      };

      this.getTrack = function( id ) {

        return tracks[ id ];
      };

      this.addTrack = function( track ) {

        container.appendChild( track.getElement() );
        tracks[ track.getElement().id ] = track;
      };

      this.removeTrack = function( track ) {

        container.removeChild( track.getElement() );
        delete tracks[ track.getElement().id ];
        return track;
      };

      this.deselectOthers = function() {
        for (var j in tracks) {
          var events = tracks[j].getTrackEvents();
          for (var i in events) {
            if (events[i].selected) {
              events[i].deselect();
            } //if
          } //for
        } //for
        return self;
      };

      this.plugins = plugins;

      this.plugin = addPlugin;

      this.setScale = function ( scale ) {
        userElement.style.width = duration * scale + "px";
        userElement.style.minWidth = duration * scale + "px";
      };

      this.setScale(scale);

      var Track = function(inc) {

        var trackId = "trackLiner" + trackCount++,
            events = {},
            that = this,
            element = document.createElement( "div" );

        element.style.background = "-moz-linear-gradient(top,  #eee,  #999)";
        element.style.height = "36px";
        element.style.position = "relative";
        element.id = trackId;

        $( element ).droppable( { 
          greedy: true,

          // this is dropping an event on a track
          drop: function( event, ui ) {

            var eventId = ui.draggable[ 0 ].id,
                trackId = this.id,
                type = ui.draggable[ 0 ].getAttribute('data-trackliner-type'),
                parentId = ui.draggable[ 0 ].parentNode.id;

            if ( self.getTrack( parentId ) ) {
              that.addTrackEvent( self.getTrack( parentId ).removeTrackEvent( eventId ) );
            }
            else {

              if ( type && plugins[ type ]) {
                that.createTrackEvent( type, {left: event.clientX/scale}, event, ui );
              } //if

            } //if
          }
        });

        this.getElement = function() {
          return element;
        };

        this.createEventElement = function ( options ) {
          var element = document.createElement('DIV');
          element.style.cursor = options.cursor || "move";
          element.style.background = options.backgroud || "-moz-linear-gradient(top,  #ff0,  #660)";
          element.style.opacity = options.opacity || "0.5";
          element.style.height = options.height || "100%";
          element.style.width = options.width ? options.width*scale + "px" : "100px";
          element.style.position = options.position || "absolute";
          element.style.top = options.top || "0px";
          element.style.left = options.left ? options.left*scale + "px" : "0px";
          element.innerHTML = options.innerHTML || '';
          element.className = options.className || '';
          return element;
        } //createEventElement

        this.createTrackEvent = function( type, inputOptions, event, ui ) {

          var trackEvent = {},
              eventId = "trackEvent" + eventCount++,
              inputOptions = typeof(type) === 'string' ? inputOptions : type,
              type = typeof(type) === 'string' ? type : (restrictToKnownPlugins ? undefined : 'default'),
              pluginDef = plugins[ type ];
              
          if (pluginDef) {

            var trackOptions = plugins[ type ].setup( that, inputOptions, event, ui );

            var movedCallback = function( event, ui ) {
              var eventElement = trackEvent.element;
              eventElement.style.top = "0px";
              pluginDef.moved( that, trackEvent, event, ui );
            };

            trackEvent.options = inputOptions;
            trackEvent.element = trackOptions.element || this.createEventElement ( trackOptions );
            trackEvent.element.id = eventId;
            trackEvent.element.addEventListener('click', function (e) {
              pluginDef.click( that, trackEvent, e );
            }, false);
            trackEvent.element.addEventListener('dblclick', function (e) {
              pluginDef.dblclick( that, trackEvent, e );
            }, false);
            trackEvent.type = type;
            //trackEvent.element = element;

            trackEvent.selected = false;
            trackEvent.select = function (e) {
              self.deselectOthers();
              trackEvent.selected = true;
              plugins[ type ].select(that, trackEvent, null);
            };

            trackEvent.deselect = function (e) {
              trackEvent.selected = false;
              plugins[ type ].deselect(that, trackEvent, null);
            };

            $( trackEvent.element ).draggable( { /*grid: [ 1, 36 ],*/ containment: parent, zIndex: 9001, scroll: true,
              // this is when an event stops being dragged
              start: function ( event, ui ) {
              },
              stop: movedCallback
            }).resizable({ 
              autoHide: true, 
              containment: "parent", 
              handles: 'e, w', 
              scroll: false,
              stop: movedCallback
            });

            this.addTrackEvent( trackEvent );

            return this;
          } //if
        };

        this.addTrackEvent = function( trackEvent ) {
          events[ trackEvent.element.id ] = trackEvent;
          element.appendChild( trackEvent.element );
          trackEvent.trackId = trackId;
          return this;
        };

        this.getTrackEvent = function( id ) {
          return events[ id ];
        };

        this.getTrackEvents = function () {
          return events;
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

      /*this.length = function() {

        return trackArray.length;
      };*/

      return this;

    } //if (this !== window)

  }; //TrackLiner

  TrackLiner.plugin = addPlugin;

  window.TrackLiner = TrackLiner;

  TrackLiner.plugin( 'default', {
    setup: function ( track, options, event, ui ) {
      var left = options.left || options.x || options.start || 0;
      var width = options.width || options.end ? options.end - left : 1;
      return {
        left: left,
        width: width,
        innerHTML: options.label || '',
        className: options.className || '',
      };
    },
    moved: function (track, trackEventObj, event, ui) {
    },
    click: function (track, trackEventObj, event) {
      trackEventObj.select();
    },
    dblclick: function (track, trackEventObj, event) {
    },
    select: function (track, trackEventObj, event) {
      trackEventObj.element.style.background = "-moz-linear-gradient(top,  #0f0,  #060)";
    },
    deselect: function (track, trackEventObj, event) {
      trackEventObj.element.style.background = "-moz-linear-gradient(top,  #ff0,  #660)";
    },
  });

}(window));

