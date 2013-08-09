/**
 * Plugin: tooltip
 * Date：20130118~
 * Author:caiguangsong
 * Mail:gidcai#gmail.com
 * Last update:2013/02/28
 * 
 *  ~ 2013/02/18 : add option 'arrowSize'  && fixed 'leftBottom' miscalculation bug
 *  ~ 2013/02/28 : fix fast hover bug,when multi events binding
 *  ~ 2013/08/07 : fix some postion bugs
 *  ~ 2013/08/09 : fix some postion bugs and change litte api
 */

(function($, exports) {

	var comPrefix = 'your_company';

	function isFunction(object) {
		return Object.prototype.toString.call(object) === '[object Function]';
	}
	function throwError(msg) {
		throw new Error(msg);
	}

	$.fn.extend({getsPos:function(){if(!this[0])return null;var a=$(this[0]).offset(),b=a.top,c=a.left,d=b-$(window).scrollTop(),e=c-$(window).scrollLeft(),f=$(window).height(),g=$(window).width(),h=!1,i=!1,j=!1,k=!1,l=0,m=void 0;return f/2-d>0?h=!0:i=!0,g/2-e>0?j=!0:k=!0,h&&j&&(l=1,m=g/f>e/d?"leftTop":"topLeft"),h&&k&&(l=2,m=g/f>(e-g/2)/(f/2-d)?"topRight":"rightTop"),i&&k&&(l=3,m=g/f>(e-g/2)/(d-f/2)?"rightBottom":"bottomRight"),i&&j&&(l=4,m=g/f>e/(f-d)?"bottomLeft":"leftBottom"),{sTop:d,sLeft:e,sWidth:g,sHeight:f,top:b,left:c,curPos:l,angle:m}}});

	$.tooltip = function(id, optss) {
		return new $.tooltip.fn.init(id, optss);
	}

	$.tooltip.fn = $.tooltip.prototype = {
		constructor: $.tooltip,
		tooltipId: '',
		isIe6:/MSIE 6\.\d+/i.test(navigator.userAgent),
		loadingTmpl:'<p class="defalut_tooltip_loading">loading....</p>',
		target:null,
		_template:'', //  original templ
		template:'', // jquery obj,
		timeer:null,
		otimeer:null,
		vtimeer:null,
		votimeer:null,
		init: function(o, opts) {

			this.options = {};

			jQuery.extend(true, this.options, opts);
			var fn = this;
			var op = this.options;
			if($(op.template).length && $(op.template)[0].nodeName.toLowerCase() == 'script'){
				op.template = $(op.template).html();
			}

			if($.type(op.offset) == 'number'){
				 op.offset = [0,0];
			}

			this._template = op.template;

			if(op.trigger == 'hover'){
				$(o).on('mouseenter',op.selector,function(){
					
					fn.selector(this);

					clearTimeout($(this).data('votimeer')); // clear from tips out
					var timeer = setTimeout(function(){
						fn._init();
					},300);
					$(this).data('timeer',timeer);
				}).on('mouseleave',op.selector,function(){
					clearTimeout($(this).data('timeer')); // clear fast hover  
					var otimeer = setTimeout(function(){
						fn.hide();
					},50)
					$(this).data('otimeer',otimeer);
				});
			}else if(op.trigger == 'click'){
				$(o).on('click',op.selector,function(){
					fn.selector(this);
					if($('#'+fn.tooltipId).is(':visible')){
						fn.hide();
					}else{				
						fn._init();
					}
				})
			}else{
				throwError('evt "argument" setting error!');
			}
			return this;
		},
		selector:function(o){
			
			var fn = this;
			var op = this.options;
			var curId = comPrefix+"_ui_tooltip_" + (new Date).getTime();
			if(fn.tooltipId != curId){ // fix fast hover bug
				fn.hide(); 
			}
			fn.tooltipId = curId;
			op.template = fn._template;
			fn.template = $(op.template).attr('id',curId);
			fn.target = o;
			// fn.timeer = null; // 优化 页面储存
			// fn.otimeer = null;
			// fn.vtimeer = null;
			// fn.votimeer = null;
			fn.hide();
		},
		_init: function() {
			var op = this.options;

			this.format().loading().show().position().bindEvent().content().callback();
			// 插入内容，显示，定位，事件绑定，插入加载后的内容
		},
		loading:function(){
			var fn = this;
			var op = this.options;
			if(op.loading){
				if(typeof op.loading == 'boolean'){
					fn.insertContent(fn.loadingTmpl);
				}else{
					fn.insertContent(op.loading);
				}
			}
			return this;
		},
		format: function() { // 格式化模板
			var fn = this;
			var op = this.options;
			var contips = $(fn.target).data('tooltip');
			fn.insertContent(contips);
			return this;
		},
		insertContent:function(cnt){
			var fn = this;
			var op = this.options;

			if(cnt == undefined){
				return this;
			}
			if($('#'+fn.tooltipId).length){
				$('#'+fn.tooltipId).find('[data-tooltip="content"]').empty().append(cnt);
			}else{
				fn.template.find('[data-tooltip="content"]').empty().append(cnt);
			}
			return this;
		},
		content: function() { // API
			var fn = this;
			var op = this.options;
			var cnt;
			if(isFunction(op.content)){
				cnt = op.content.call(fn)
			}
			if(cnt){
				fn.insertContent(cnt);
			}
			return this;
		},
		position:function(){
			var fn = this;
			var op = this.options;
			var _position = null;
			var getsP =  $(fn.target).getsPos();
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
				_position = tipsPos[getsP.angle];
			}else{
				_position = op.position;
			}
			if(op.position == 'auto' && op.center && /([a-z]+)[A-Z]([a-z]+)/.test(_position)){ // 四轮中心定位
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
				 pos = $(fn.target).position();
				 offset = {
				 	left:0,
				 	top:0				 	
				 }
			}
			actualSize = {
				width:$('#' + fn.tooltipId).outerWidth(),
				height:$('#' + fn.tooltipId).outerHeight()
			}; // tooltip  size

			tarSize = {
				width:$(fn.target).outerWidth(),
				height:$(fn.target).outerHeight()
			}; // 定位元素 size 

			switch(_position){
				case 'bottomLeft':
					tcs = {
						left:pos.left + offset.left + tarSize.width - actualSize.width + op.offset[0] ,
						top:pos.top + offset.top + tarSize.height + op.arrowSize
					}
					arrow = 'arrow_top_right'; // bottomLeft

				break;	
				case 'bottomRight':	
					tcs = { //  放在下面
						left:pos.left + offset.left - op.offset[0],
						top:pos.top + offset.top + tarSize.height + op.arrowSize  
					}
					arrow = 'arrow_top_left'; // bottomRight
				break;
				case 'bottom':	
				case 'bottomCenter':
					tcs = { //  放在下面 ok
						left:pos.left + offset.left - 1/2 * (actualSize.width - tarSize.width),
						top:pos.top + offset.top + tarSize.height  + op.arrowSize
					}
					arrow = 'arrow_top_center'; // bottomRight
				break;
				// ----------------------------------------------
				case 'topLeft':
					tcs = {
						left:pos.left + offset.left + tarSize.width - actualSize.width + op.offset[0] ,
						top:pos.top + offset.top - actualSize.height - op.arrowSize
					}
					arrow = 'arrow_bottom_right';// topLeft
				break;	
				case 'topRight':
					tcs = {
						left:pos.left + offset.left - op.offset[0],
						top:pos.top + offset.top - actualSize.height - op.arrowSize
					}
					arrow = 'arrow_bottom_left'; // topRight

				break;	
				case 'top':
				case 'topCenter':
					tcs = { //ok 
						left:pos.left + offset.left - 1/2 * (actualSize.width - tarSize.width),
						top:pos.top + offset.top  - actualSize.height - op.arrowSize 
					}
					arrow = 'arrow_bottom_center';// topLeft
				break;

				// ----------------------------------------------
				case 'leftTop':

					tcs = {
						left:pos.left + offset.left - actualSize.width - op.arrowSize,
						top:pos.top + offset.top  + tarSize.height -  actualSize.height + op.offset[1] 
					}
					arrow = 'arrow_right_bottom'; // leftTop
				break;
				case 'leftBottom':// 
					tcs = {
						left:pos.left + offset.left - actualSize.width - op.arrowSize,
						top:pos.top + offset.top  - op.offset[1]
					}
					arrow = 'arrow_right_top'; // leftBottom
				break;
				case 'left':
				case 'leftCenter':
					tcs = { // ok
						left:pos.left + offset.left - actualSize.width - op.arrowSize,
						top:pos.top + offset.top  - 1/2 * (actualSize.height - tarSize.height) 
					}
					arrow = 'arrow_right_center'; // leftTop
				break;
				// ----------------------------------------------
				case 'rightTop':
					tcs = {
						left:pos.left + offset.left + tarSize.width + op.arrowSize,
						top:pos.top + offset.top  + tarSize.height  -  actualSize.height + op.offset[1]
					}
					arrow = 'arrow_left_bottom'; // rightTop
				break;
				case 'rightBottom': // 元素在屏幕 左上方
					tcs = { //  放在右面
						left:pos.left + offset.left + tarSize.width + op.arrowSize ,
						top:pos.top + offset.top - op.offset[1]
					}
					arrow = 'arrow_left_top'; // rightBottom
				break;

				case 'right':
				case 'rightCenter':				
					tcs = {  // ok
						left:pos.left + offset.left + tarSize.width + op.arrowSize,
						top:pos.top + offset.top  - 1/2 * (actualSize.height - tarSize.height) 
					}
					arrow = 'arrow_left_center'; // rightTop
				break;
				default:throwError(" argument 'position' error!");
			}

			this.setStyle(tcs,_position,arrow);
			return this;
		},
		setStyle: function(param,s,k) { //样式设定
			var fn = this;
			var ie6_iframe = '<iframe class="tooltip_iframe" style="position: absolute; left: 0px; filter: progid:dximagetransform.microsoft.alpha(opacity=0); z-index: -1; top: 0px; opacity: 0" height="100%" frameborder=no width="100%"></iframe>';

			$('#'+fn.tooltipId).css($.extend({},{
				zIndex: this.options.zIndex,
				position: "absolute"
			},param)).addClass(s).addClass(k).append(this.isIe6 ? ie6_iframe : '');

			return this;
		},
		show: function() {
			var fn = this;
			var op = this.options;
			if(op.appendTo == 'body'){
				fn.template.appendTo('body');
			}else if(op.appendTo == 'after'){
				//$(fn.target).after(fn.template);
				fn.template.insertAfter(fn.target);
			}
			return this;
		},
		hide: function() { // pass
			var op = this.options;
			if(op.selector){
				$('.tooltip').remove();
			}
			$('#' + this.tooltipId).remove();
			return this;
		},
		bindEvent: function() { //pass
			var fn = this;
			var op = this.options;
			var that = $('#' + fn.tooltipId);
			if(op.visible){
				that.on('mouseenter',function(){
					clearTimeout($(fn.target).data('otimeer'));  // clear out form target
					clearTimeout($(fn.target).data('votimeer'));  // clear out come back
				}).on('mouseleave',function(){
					clearTimeout($(fn.target).data('votimeer')); 
					var votimeer = setTimeout(function(){
						fn.hide();
					},300)
					$(fn.target).data('votimeer',votimeer);
				})
			}
			if(op.close) {
				that.find('[data-tooltip="close"]').bind('click', function() {
					fn.hide();
				});
			}

			return this;
		},
		callback:function(){
			var fn = this;
			var op = this.options;
			op.callback.call(fn);
			return this;		
		}
	}

	$.tooltip.fn.init.prototype = $.tooltip.fn;

	$.fn.tooltip = function(optss) {

		var opts = $.extend(true, {}, $.tooltip.defaults, optss);

		if(!this.length) {
			return this;
		}
		this.each(function() {
			$.tooltip(this, opts);
		});

		return this;
	};
	// default optss
	$.tooltip.defaults = {
		template: undefined,
		content: null,
		loading:null,
		trigger:'hover', // hover click
		selector:false,
		visible:false, // when  the mouse leave the target , over the tips ,tips is visible ?
		timeout: 0,
		zIndex: 1990,
		position:"auto",  // auto left top right bottom
		appendTo:'body',
		offset:[0,25], // [x,y]
		arrowSize:6,
		close: false, // close btn
		center:false,
		callback: function() {}
	};
})(jQuery, this);