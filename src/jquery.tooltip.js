/**
 * Plugin: tooltip
 * Date：20130118~
 * Author:caiguangsong
 * Mail:gidcai#gmail.com
 * Last update:2014/04/13
 * 
 *  ~ 2013/02/18 : add option 'arrowSize'  && fixed 'leftBottom' miscalculation bug
 *  ~ 2013/02/28 : fix fast hover bug,when multi events binding
 *  ~ 2013/08/07 : fix some postion bugs
 *  ~ 2013/08/09 : fix some postion bugs and change litte api
 *  ~ 2014/04/13 : reconstruct this
 */

var Browser = {
	isIE6: /MSIE\s*6\.\d+/i.test(navigator.userAgent)
};

(function($,window,undefined){
	$.fn.extend({
		getsPos: function() {
			if (!this[0]) return null;
			var a = $(this[0]).offset(),
				b = a.top,
				c = a.left,
				d = b - $(window).scrollTop(),
				e = c - $(window).scrollLeft(),
				f = $(window).height(),
				g = $(window).width(),
				h = !1,
				i = !1,
				j = !1,
				k = !1,
				l = 0,
				m = void 0;
			return f / 2 - d > 0 ? h = !0 : i = !0, g / 2 - e > 0 ? j = !0 : k = !0, h && j && (l = 1, m = g / f > e / d ? "leftTop" : "topLeft"), h && k && (l = 2, m = g / f > (e - g / 2) / (f / 2 - d) ? "topRight" : "rightTop"), i && k && (l = 3, m = g / f > (e - g / 2) / (d - f / 2) ? "rightBottom" : "bottomRight"), i && j && (l = 4, m = g / f > e / (f - d) ? "bottomLeft" : "leftBottom"), {
				sTop: d,
				sLeft: e,
				sWidth: g,
				sHeight: f,
				top: b,
				left: c,
				curPos: l,
				angle: m
			}
		}
	});
})(jQuery,window);

(function($, exports) {

	var comPrefix = window.comPrefix || 'youcompany';

	function throwError(msg) {
		try{
			console.info(msg)
		}catch(e){}
	}
	Tooltip = function(id, opts) {
		var opts = $.extend(true, {}, Tooltip.defaults, opts);
		return new Tooltip.fn.initialize(id, opts);
	};

	Tooltip.fn = Tooltip.prototype = {
		constructor: Tooltip,
		initialize: function(o, opts) {
			this.options = opts;
			this.target = null;
			this._template =''; //  original templ
			this.template = '';  // jquery obj,
			this.timeer = null;
			this.otimeer = null;
			this.vtimeer  = null;
			this.votimeer = null;
			this.tooltipId = '';
			this.loadingTmpl = '<p class="tooltip-defalut-loading">loading...</p>';
			var op = this.options;
			if($(op.template).closest('body').length){ // get form current page;;
				op.template = $(op.template).html();
			}
			if($.type(op.offset) == 'number'){// compatible older
				 op.offset = [0,0];
			}
			this._template = op.template;
			this.initEvent(o);
		},
		initEvent: function(o){
			var me =  this;
			var op = this.options;
			if(op.trigger == 'hover'){
				$(o).on('mouseenter',op.selector,function(){
					me.setTarget(this);
					clearTimeout($(this).data('votimeer')); // clear from tips out
					var timeer = setTimeout(function(){
						me.fireEvent();
					},300);
					$(this).data('timeer',timeer);
				}).on('mouseleave',op.selector,function(){
					clearTimeout($(this).data('timeer')); // clear fast hover  
					var otimeer = setTimeout(function(){
						me.destroy();
					},50)
					$(this).data('otimeer',otimeer);
				});
			}else if(op.trigger == 'click'){
				$(o).on('click',op.selector,function(){
					me.setTarget(this);
					if(this.getDom().is(':visible')){
						me.destroy();
					}else{				
						me.fireEvent();
					}
				})
			}else{
				throwError('evt "argument" setting error!');
			}
		},
		fireEvent: function() {
			var op = this.options;
			this.getTemplate()
				.beforeRender()
				.render().setPosition()
			    .afterRender();
		},
		setTarget:function(o){
			var op = this.options;
			var curId = comPrefix+"_ui_tooltip_" + (new Date).getTime();
			if(this.tooltipId != curId){ // fix fast hover bug
				this.destroy(); 
			}
			this.tooltipId = curId;
			op.template = this._template;
			this.template = $(op.template).attr('id',curId);
			this.target = o;
			this.destroy();
		},
		getDom: function(){// tooltipId is dynamic
			return $('#'+ this.tooltipId);
		},
		getTarget: function(){
			if(this.options.selector){
				return $(this.target);
			}
			if(this._$target)
				return  this._$target;
			else{
				this._$target = $(this.target);
				return this._$target;
			}
		},
		beforeRender:function(){
			var op = this.options;
			if(op.loading){
				if(typeof op.loading == 'boolean'){
					this.insertContent(this.loadingTmpl);
				}else{
					this.insertContent(op.loading);
				}
			}
			return this;
		},
		getTemplate: function() {
			var fn = this;
			var op = this.options;
			var contips = this.getTarget().data('tooltip');
			fn.insertContent(contips);
			return this;
		},
		insertContent:function(cnt){
			var fn = this;
			var op = this.options;

			if(cnt == undefined){
				return this;
			}
			if(this.getDom().length){
				this.getDom().find('[data-tooltip="content"]').empty().append(cnt);
			}else{
				fn.template.find('[data-tooltip="content"]').empty().append(cnt);
			}
			return this;
		},
		afterRender: function(){
			this.bindDomEvent();
			this.setContent();
			this.callback();
		},
		setContent: function() { // API
			var fn = this;
			var op = this.options;
			var cnt;
			if($.isFunction(op.content)){
				cnt = op.content.call(fn)
			}
			if(cnt){
				fn.insertContent(cnt);
			}
		},
		setPosition: function(){
			if($.isFunction(this.options.position))
				this.options.position.call(this,this.getDom(),this.getTarget())
			else
				this.setDynamicPos();
			return this;
		},
		setDynamicPos: function(){
			var params = this.getPositionOffset();
			var offset = params.offset;
			var bgiframe = '<iframe class="bgiframe" style="position: absolute; left: 0px; top: 0px;\
							 filter: progid:dximagetransform.microsoft.alpha(opacity=0); z-index: -1; opacity: 0" \
							 height="100%" frameborder=no width="100%"></iframe>';
			this.getDom().css({
				zIndex: this.options.zIndex,
				position: "absolute"
			}).css(offset).addClass(params.position);
			var arrowObj = this.getDom().find('[data-tooltip="arrow"]');
			if(arrowObj.length)
				arrowObj.addClass(params.arrowClass);
			else
				this.getDom().addClass(params.arrowClass);
			this.getDom().append(Browser.isIE6 ? bgiframe : '');
		},
		getPositionOffset:function(){
			var fn = this;
			var op = this.options;
			var _position = null;
			var getsP =  this.getTarget().getsPos();
			var tipsPos = { // screen -> tips
				topLeft:'bottomRight',
				leftTop:'rightBottom',

				topRight:'bottomLeft',
				rightTop:'leftBottom',

				bottomRight:'topLeft',
				rightBottom:'leftTop',

				bottomLeft:'topRight',
				leftBottom:'rightTop'
			};

			if(op.position == 'auto'){
				_position = tipsPos[getsP.angle]; // translate screen position to arrow position
			}else{
				_position = op.position;
			}
			// four  center  direction auto position
			if(op.position == 'auto' && op.center && /([a-z]+)[A-Z]([a-z]+)/.test(_position)){ 
				_position = RegExp.$1 + 'Center';
			}
			var tcs,pos,offset,actualSize,tarSize,arrow;
			if(op.appendTo == 'body'){
				 pos = {
				 	left:0,
				 	top:0
				 }
				 offset = {
				 	left:getsP.left,
				 	top:getsP.top
				 };
			}else if(op.appendTo == 'after'){
				 pos = this.getTarget().position();
				 offset = {
				 	left:0,
				 	top:0				 	
				 }
			}
			actualSize = {
				width: this.getDom().outerWidth(),
				height: this.getDom().outerHeight()
			}; // tooltip  size

			tarSize = {
				width:this.getTarget().outerWidth(),
				height:this.getTarget().outerHeight()
			}; // target size 
			switch(_position){
				case 'bottomLeft':
					tcs = {
						left:pos.left + offset.left + tarSize.width - actualSize.width + op.offset[0] ,
						top:pos.top + offset.top + tarSize.height + op.arrowSize
					}
					arrow = 'arrow-top-right'; // bottomLeft

				break;	
				case 'bottomRight':	
					tcs = { 
						left:pos.left + offset.left - op.offset[0],
						top:pos.top + offset.top + tarSize.height + op.arrowSize  
					}
					arrow = 'arrow-top-left'; // bottomRight
				break;
				case 'bottom':	
				case 'bottomCenter':
					tcs = {
						left:pos.left + offset.left - 1/2 * (actualSize.width - tarSize.width),
						top:pos.top + offset.top + tarSize.height  + op.arrowSize
					}
					arrow = 'arrow-top-center'; // bottomRight
				break;
				// ----------------------------------------------
				case 'topLeft':
					tcs = {
						left:pos.left + offset.left + tarSize.width - actualSize.width + op.offset[0] ,
						top:pos.top + offset.top - actualSize.height - op.arrowSize
					}
					arrow = 'arrow-bottom-right';// topLeft
				break;	
				case 'topRight':
					tcs = {
						left:pos.left + offset.left - op.offset[0],
						top:pos.top + offset.top - actualSize.height - op.arrowSize
					}
					arrow = 'arrow-bottom-left'; // topRight

				break;	
				case 'top':
				case 'topCenter':
					tcs = { //ok 
						left:pos.left + offset.left - 1/2 * (actualSize.width - tarSize.width),
						top:pos.top + offset.top  - actualSize.height - op.arrowSize 
					}
					arrow = 'arrow-bottom-center';// topLeft
				break;

				// ----------------------------------------------
				case 'leftTop':

					tcs = {
						left:pos.left + offset.left - actualSize.width - op.arrowSize,
						top:pos.top + offset.top  + tarSize.height -  actualSize.height + op.offset[1] 
					}
					arrow = 'arrow-right-bottom'; // leftTop
				break;
				case 'leftBottom':// 
					tcs = {
						left:pos.left + offset.left - actualSize.width - op.arrowSize,
						top:pos.top + offset.top  - op.offset[1]
					}
					arrow = 'arrow-right-top'; // leftBottom
				break;
				case 'left':
				case 'leftCenter':
					tcs = { // ok
						left:pos.left + offset.left - actualSize.width - op.arrowSize,
						top:pos.top + offset.top  - 1/2 * (actualSize.height - tarSize.height) 
					}
					arrow = 'arrow-right-center'; // leftTop
				break;
				// ----------------------------------------------
				case 'rightTop':
					tcs = {
						left:pos.left + offset.left + tarSize.width + op.arrowSize,
						top:pos.top + offset.top  + tarSize.height  -  actualSize.height + op.offset[1]
					}
					arrow = 'arrow-left-bottom'; // rightTop
				break;
				case 'rightBottom': 
					tcs = { 
						left:pos.left + offset.left + tarSize.width + op.arrowSize ,
						top:pos.top + offset.top - op.offset[1]
					}
					arrow = 'arrow-left-top'; // rightBottom
				break;

				case 'right':
				case 'rightCenter':				
					tcs = {  // ok
						left:pos.left + offset.left + tarSize.width + op.arrowSize,
						top:pos.top + offset.top  - 1/2 * (actualSize.height - tarSize.height) 
					}
					arrow = 'arrow-left-center'; // rightTop
				break;
				default:throwError(" argument 'position' error!");
			};
			return {
				offset: tcs,
				position:_position,
				arrowClass:arrow
			};
		},
		render: function() {
			var op = this.options;
			if(op.appendTo == 'body'){
				this.template.appendTo('body');
			}else if(op.appendTo == 'after'){
				this.template.insertAfter(this.getTarget());
			}
			return this;
		},
		destroy: function() { // pass
			if(this.options.selector){
				$('.tooltip').remove();
			}
			this.getDom().remove();
			return this;
		},
		bindDomEvent: function() { //pass
			var me = this;
			if(this.options.visible){
				this.getDom().on('mouseenter',function(){
					clearTimeout(me.getTarget().data('otimeer'));  // clear out form target
					clearTimeout(me.getTarget().data('votimeer'));  // clear out come back
				}).on('mouseleave',function(){
					clearTimeout(me.getTarget().data('votimeer')); 
					var votimeer = setTimeout(function(){
						me.destroy();
					},300)
					me.getTarget().data('votimeer',votimeer);
				})
			}
			if(this.options.close) {
				this.getDom().find('[data-tooltip="close"]').bind('click', function() {
					me.destroy();
				});
			}
		},
		callback:function(){
			this.options.callback.call(this,this.getPositionOffset());	
		}
	}

	Tooltip.fn.initialize.prototype = Tooltip.fn;

	// default opts
	Tooltip.defaults = {
		template: undefined,
		content: undefined,
		loading: undefined,
		trigger:'hover', // hover click
		selector:false,
		visible:false, // when  the mouse leave the target , over the tips ,tips is visible ?
		timeout: 0,
		zIndex: 1990,
		position:"auto",  // auto left top right bottom function(){};
		appendTo:'body', // || 'after'
		offset:[0,25], // [x,y]
		arrowSize:6,
		close: false, // close btn
		center:false,
		callback: function() {}
	};


	// import api
	$.tooltip = function(dom,opts){
		return new Tooltip(dom,opts)
	};

	$.fn.tooltip = function(opts) {
		if(!this.length) {
			return this;
		}
		this.each(function() {
			new Tooltip(this, opts);
		});
		return this;
	};
})(jQuery, this);