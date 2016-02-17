var rockpool = rockpool || {};

rockpool.widget =  function( type, rule, key ) {

    this.setHandler = function(key){
        this.handler_key = key;
        this.options = null;
        switch(this.type){
            case 'converter':
                this.handler = (typeof(rockpool.converters[key]) === 'function') ? new rockpool.converters[key] : rockpool.converters[key];
                rule.updateDom();
                break;
            case 'input':
                this.handler = (typeof(rockpool.inputs[key]) === 'function') ? new rockpool.inputs[key] : rockpool.inputs[key];
                break;
            case 'output':
                this.handler = (typeof(rockpool.outputs[key]) === 'function') ? new rockpool.outputs[key] : rockpool.outputs[key];
                break;
        }
        this.dom_update_needed = true;
    }

    this.killChild = function(){
        if(!this.child) return false;
        this.child.kill();
        this.child = null;
    }

    this.hasOptions = function(){
        return this.handler.options ? true : false;
    }

    this.getOption = function(option) {
        return (this.options && this.options[option]) ? this.options[option] : this.handler[option];
    }

    this.hasValue = function(){
        return typeof(this.handler.setValue) == "function"
    }

    this.getValue = function(){
        return typeof(this.handler.getValue) == "function" ? this.handler.getValue(this.option_index) : -1;
    }

    this.setOptions = function(index,value) {
        if (!this.hasOptions()) return false;

        this.option_index = index;

        if(typeof(value) != "undefined" && this.handler.setValue){
            this.handler.setValue(index,value);
        }

        if(this.options != this.handler.options[index]){
            this.dom_update_needed = true;
        }
        this.options = this.handler.options[index];
    }

    this.tooltip = function(text){
        tip = $('<div class="help-balloon"></div>');
        tip.on('click',function(){rockpool.closeModal()}).html(text);
        rockpool.modal_activator = this.icon;
        rockpool.modal(tip);
    }

    this.update = function(force){
        if(this.dom_update_needed || force == true){
            this.dom_update_needed = false;

            this.setLabel(   this.getOption('name') );
            this.setSubType( this.getOption('type') );
            this.setIcon(    this.getOption('icon') );

            var color = this.getOption('color');

            if(!this.handler.active){
                color = 'grey';
            }

            if(this.isComparator()){
                rule.updateDom();
            }

            if(this.child){
                //this.child.updateDom();
                this.child.updateLabels();
            }

            var row_height = this.dom.height();
            var group_offset = this.dom.parents('.rulegroup').offset().top + 32;

            this.dom.css({
                    top: 0
            })

            var current_top = this.dom.offset().top - group_offset;

            var offset_top = 0;
            var pipe = this.dom.find('.pipe').length ? this.dom.find('.pipe') : $('<div><span>').addClass('pipe').appendTo(this.dom);
            pipe.hide();

            // There's something behind us!
            if( this.dom.prev('.block').length ){
                
                var parent_offset = this.dom.prev('.block').offset().top - group_offset;
                offset_top = parent_offset - current_top;

                if( this.isComparator() ){

                    var child_index = this.child.widget_index-1;
                    var child_offset;

                    if( child_index > -1 ){
                        child_offset = this.child.converters[child_index].dom.offset().top - group_offset;
                    }
                    else
                    {
                        child_offset = this.child.input.dom.offset().top - group_offset;
                    }


                    offset_top += ((child_offset - parent_offset) / 2);

                    pipe.css({
                        height: child_offset-parent_offset+row_height,
                        top: -(child_offset-parent_offset)/2
                    }).show();
                }

            }

            this.dom.css({
                top: offset_top
            }) 

            if( this.isOutput() ){
                this.dom.next('.block').css({
                    top:offset_top
                })
            }

            this.dom.attr('class','pure-u-1-5 center block');

            this.dom.addClass('color-' + color);
            this.dom.addClass(type + ' ' + (this.subtype?this.subtype:''));
            this.dom.addClass('name-' + this.getOption('name').toLowerCase().replace(' ','-'));

            if ( this.handler.name == "Empty" ){
                this.dom.addClass('empty');
            }
            else if( this.isComparator() ){
                this.dom.addClass('decider');
            }
            else if( this.isConverter() ){
                this.dom.addClass('converter');
            }
            else
            {
                this.dom.addClass('type-' + this.type);
            }

            if(this.getOption('category')){
                this.dom.addClass(this.getOption('category').toLowerCase())
            }

            if(this.handler.type == 'module' && !this.handler.active){
                this.dom.addClass('disconnected')
            }
        }
        this.updateCanvas();
    }

    this.setLabel = function( label ){
        if( (this.isConverter() && this.handler.name == 'Empty') || (this.isOutput() && this.handler.name == 'None') ){
            this.dom.find('.name').hide();
            return;
        }
        var channel = typeof(this.handler.channel) !== 'undefined' ? ' <span>' + rockpool.channelToNumber(this.handler.channel) + '</span>' : '';
        this.dom.find('.name').show().html( rockpool.languify(label) + channel )
    }

    this.setSubType = function( subtype ){
        this.subtype = subtype;
    }

    this.setIcon = function( icon ){
        this.img.attr('src', icon ? 'css/images/icons/icon-' + icon + '.png' : 'css/images/icon-empty.png');
        this.dom.find('i').attr('class','').addClass('icon-' + icon);
        this.dom.find('.icon').append(((this.type != 'converter' && !isNaN(this.handler.channel)) ? ' <span class="channel">' + rockpool.channelToNumber(this.handler.channel) + '</span>' : ''))
    }

    this.hide = function(){
        this.dom.hide()
    }

    this.stop = function(id){
        if( typeof(this.handler.stop) === 'function' ){
            this.handler.stop(id)
            this.handler.changed = true
        }
    }

    this.get = function(){
        var value = this.handler.get ? this.handler.get(this.options) : 0
        this.history.push(value)
        this.history = this.history.slice(-200)

        if( this.isInput() ){
            var raw = Math.round(value*1000).toString();
            if( this.handler.raw ){
                raw = this.handler.raw(this.options) + '<small>' + raw +  '</small>';
            }
            if( raw != this.last_inspector_value ){
                this.inspector.html(raw);
                this.last_inspector_value = raw;
            }
        }

        return value
    }

    this.convert = function(value){

        var output =  this.handler.convert ? this.handler.convert(value) : 0
        this.history.push(output)
        this.history = this.history.slice(-200)

        return output
    }

    this.set = function(value, idx){
        if(!this.handler){
            return false;
        }

        if( this.isOutput() ){
            var raw = Math.round(value*1000).toString();
            if( raw != this.last_inspector_value ){
                this.inspector.html(raw);
                this.last_inspector_value = raw;
            }
        }

        if(this.handler.set){
            this.lastSet = value;
            this.handler.set(value, idx, this.options);
            this.handler.changed = true;
        }
    }

    this.isInput = function(){
        return typeof(this.handler.get) === 'function'
    }

    this.isOutput = function(){
        return !this.isComparator() && typeof(this.handler.set) === 'function'
    }

    this.isComparator = function() {
        return typeof(this.handler.set) === 'function' && typeof(this.handler.convert) === 'function' ? true : false
    }

    this.isConverter = function() {
        return typeof(this.handler.convert) === 'function';
    }

    this.respond = function () {
        this.updateCanvas();
    }

    this.drawChartLines = function(width, height, context, values) {
        var max = Math.round((width) / this.dotSpacing) + 1;
        var points = [];

        for(var i = 0; i < max; i++) {
            var value = values[values.length - 1 - i] * (height - (this.verticalMargin*2));

            points.push({
                x: width  - ( i * this.dotSpacing ),
                y: height - ( value ) - this.verticalMargin
            })
        }

        context.beginPath(); 
        context.moveTo(points[0].x, points[0].y);
        for (i = 1; i < points.length; i ++){context.lineTo(points[i].x, points[i].y);}
        context.stroke();
    }

    this.drawChart = function(){
        if( this.type == 'output' ) return false;

        var canvas = this.canvas[0]
        var values = this.history

        if(canvas.getContext) {

            var context = canvas.getContext('2d');

            context.clearRect(0, 0, canvas.width, canvas.height);

            if( this.type != 'input' && this.handler.name == 'Empty' ){
                if( ! this.previous_canvas )  this.previous_canvas  = this.dom.prev('div').find('canvas');
                context.drawImage(this.previous_canvas[0], 0, 0);
                return false;
            }

            this.drawChartLines(canvas.width, canvas.height, context, values);

            /*
            This blends the right-hand edge of the graph into the pipe so it doesn't
            end abruptly on converters. It looks nice, but it probably doesn't do much
            for performance. Remove, or add conditional logic, to optimise.
                */
            context.save();
            context.globalCompositeOperation = "destination-in"
            gradient = context.createLinearGradient(0, 0, canvas.width, 0)
            gradient.addColorStop(0.0, "rgba(255, 255, 255, 0.0)");
            gradient.addColorStop(0.1, "rgba(255, 255, 255, 1.0)");
            gradient.addColorStop(0.9, "rgba(255, 255, 255, 1.0)");
            gradient.addColorStop(1.0, "rgba(255, 255, 255, 0.0)");
            context.fillStyle = gradient;
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.restore();
            

        }
    }

    this.updateCanvas = function(){
        if( this.type == 'output' ) return false;

        this.canvas.attr({
            'height': this.graph.height() + 'px',
            'width':  (this.graph.width() - 36)  + 'px'
        });

        if(this.canvas[0].getContext) {
            var context = this.canvas[0].getContext('2d');
            context.lineWidth   = "3";
            context.strokeStyle = 'rgba(255,255,255,0.5)';
            context.fillStyle   = 'rgba(255,255,255,0.1)';

            if(typeof(this.canvas.css('border-top-color') != 'undefined')){
                context.strokeStyle = this.canvas.css('border-top-color');
            }

            if(typeof(this.canvas.css('border-bottom-color') != 'undefined')){
                context.fillStyle = this.canvas.css('border-bottom-color');
            }
        }
    }

    this.option_index = -1;
    this.last_inspector_value = 0;

    this.type        = type;
    this.subtype     = null;
    this.handler_key = null;
    this.handler     = null;
    this.setHandler(key);

    this.lastSet = null;
    this.child   = null;

    this.options = {};
    this.history = [];

    this.rightMargin    = 22; // was 50
    this.dotSpacing     = 3; // was 14
    this.verticalMargin = 2;
    this.dotRadius      = 4; // Was 5

    this.previous_canvas = null;

    this.dom_update_needed = true;

    this.dom       = $('<div class="pure-u-1-5 center block">');
    this.icon      = $('<i>').appendTo(this.dom);
    this.grah      = null;

    this.inspector = $('<div class="inspector">0</div>').appendTo(this.icon);

    if( type != 'output' ){
        this.graph  = $('<div class="graph">').appendTo(this.dom);
        this.canvas = $('<canvas>').appendTo(this.graph);
        this.updateCanvas();
    }

    this.img = $('<img src="css/images/icon-empty.png">').appendTo(this.icon);

    $('<div class="name">').appendTo(this.icon);

    this.dom.appendTo( rule.dom );

    var widget = this;


    this.dom
    .on('click', '.inspector', function(e){
        e.preventDefault();
        e.stopPropagation();

        $(this).toggleClass('detail');
    })
    .on('click','i',function(e){
        e.preventDefault();
        rockpool.add(type,rule,widget.dom.index() - 2);

        /*
        if(widget.hasOptions()){
            if(rockpool.isModalOpen()){
                rockpool.closeModal();
                rockpool.add(type,rule,widget.dom.index());
            }
            else
            {
                rockpool.modal_activator = $(this).find('img');
                rockpool.configureWidget(widget.handler_key, rule, widget.type);
            }
        }
        else
        {
            rockpool.add(type,rule,widget.dom.index());
        }
        */
        return false;
    })

    if(this.hasOptions()){
        this.setOptions(0);
    }
}