var getStyle,setStyle;
/**
 * Check the param is string type or not
 *
 * @return Boolean
 *       true if the param obj is string type
 */
var isString = function(obj) {
    return typeof obj == 'string';
};
/**
 * Check the param is array type or not
 * 
 * @return Boolean 
 *       true if the param obj is array type
 */
var isArray = function(obj) { // frames lose type, so test constructor string
    if (obj && obj.constructor && 
              obj.constructor.toString().indexOf('Array') > -1) {
        return true;
    } else {
        return isObject(obj) && obj.constructor == Array;
    }
};
/**
 * Check the pram is object type or not
 *
 * @return Boolean
 *       true if the param obj is object or not
 */
var isObject = function(obj) {
    return obj && (typeof obj == 'object' || isFunction(obj));
};
/**
 * Check the param is function type or not
 *
 * @return Boolean
 *       true if the param obj is function or not
 */
var isFunction = function(obj) {
    return typeof obj == 'function';
};
// brower detection
var ua = navigator.userAgent.toLowerCase(),
    isOpera = (ua.indexOf('opera') > -1),
    isSafari = (ua.indexOf('safari') > -1),
    isGecko = (!isOpera && !isSafari && ua.indexOf('gecko') > -1),
    isIE = (!isOpera && ua.indexOf('msie') > -1); 
    
// regex cache
var patterns = {
    HYPHEN: /(-[a-z])/i, // to normalize get/setStyle
    ROOT_TAG: /body|html/i // body for quirks mode, html for standards
};

var toCamel = function(property) {
    if ( !patterns.HYPHEN.test(property) ) {
        return property; // no hyphens
    }
        
    if (propertyCache[property]) { // already converted
        return propertyCache[property];
    }
       
    var converted = property;
 
    while( patterns.HYPHEN.exec(converted) ) {
        converted = converted.replace(RegExp.$1,
                RegExp.$1.substr(1).toUpperCase());
    }
        
    propertyCache[property] = converted;
    return converted;
};

// branching at load instead of runtime
if (document.defaultView && document.defaultView.getComputedStyle) { // W3C DOM method
    getStyle = function(el, property) {
        var value = null;           
        if (property == 'float') { // fix reserved word
            property = 'cssFloat';
        }

        var computed = document.defaultView.getComputedStyle(el, '');
        if (computed) { // test computed before touching for safari
            value = computed[toCamel(property)];
        }
            
        return el.style[property] || value;
    };
} else if (document.documentElement.currentStyle && isIE) { // IE method
    getStyle = function(el, property) {                         
        switch( toCamel(property) ) {
            case 'opacity' :// IE opacity uses filter
                var val = 100;
                try { // will error if no DXImageTransform
                    val = el.filters['DXImageTransform.Microsoft.Alpha'].opacity;

                } catch(e) {
                    try { // make sure its in the document
                        val = el.filters('alpha').opacity;
                    } catch(e) {
                    }
                }
                return val / 100;
                break;
            case 'float': // fix reserved word
                property = 'styleFloat'; // fall through
            default: 
                // test currentStyle before touching
                var value = el.currentStyle ? el.currentStyle[property] : null;
                return ( el.style[property] || value );
       }
    };
} else { // default to inline only
    getStyle = function(el, property) { return el.style[property]; };
}
    
if (isIE) {
    setStyle = function(el, property, val) {
        switch (property) {
            case 'opacity':
                if ( isString(el.style.filter) ) { // in case not appended
                    el.style.filter = 'alpha(opacity=' + val * 100 + ')';
                    
                    if (!el.currentStyle || !el.currentStyle.hasLayout) {
                        el.style.zoom = 1; // when no layout or cant tell
                    }
                }
                break;
            case 'float':
                property = 'styleFloat';
            default:
            el.style[property] = val;
        }
    };
} else {
    setStyle = function(el, property, val) {
        if (property == 'float') {
            property = 'cssFloat';
        }
        el.style[property] = val;
    };
}
//得到元素的top:左上角的t坐标, left:左上角的l坐标, width:宽度, height:高度
function getPosition(element) {
    var top = 0, left = 0;
	var width = element.offsetWidth;
	var height = element.offsetHeight;
    do {
      top += element.offsetTop  || 0;
      left += element.offsetLeft || 0;
	  if (element) {
        if(element.tagName=='BODY') break;
        var p = getStyle(element, 'position');
        //if (p == 'relative' || p == 'absolute') break;  //huanghui@2014.06.13 如果不注释掉的话，计算的位置不正确
		if (p == 'absolute') break; 
      }
      element = element.offsetParent;
    } while (element);
	return {"top":top,"left":left,"width":width,"height":height};
}
var verifyCounter=[];
var get=function(s){
	return document.getElementById(s);
};
/**
 *
 */
function VerifyImage(eleID, opt/*这个主要用来修改默认样式属性的*/){
	var initStyleObject = {'imageStylePattern':'cursor:pointer;', 'changeToolStylePattern':'color:#666;cursor:pointer','changeToolText':'看不清楚？换一个（字母区分大小写）'};
	if(!opt){
	    opt = initStyleObject;
	}
	var c = verifyCounter.length;
	this.imageURISubfix = "{{_random_}}";
	this.imageURI =  "/passport/captcha.image?id=";
    this.initImageURI = this.imageURI + this.imageURISubfix;
	this.timeout = null;
	this.ipt = null;
    
	//生成的验证码图片的样式
    this.imageStylePattern = (!opt.imageStylePattern) ? initStyleObject.imageStylePattern : opt.imageStylePattern;
	//切换验证码的控件的样式 "color:white;cursor:pointer";
	this.changeToolStylePattern = (opt.changeToolStylePattern) ? opt.changeToolStylePattern:initStyleObject.changeToolStylePattern;
	//切换验证码的控件的提示文字   "看不清楚？换一个"
	this.changeToolText = (opt.changeToolText)?opt.changeToolText: initStyleObject.changeToolText;

	if(!eleID){
		this.eleID = eleID = "verifyIMG_" + c;
    } else {
	    this.eleID = eleID;
	}
	this.od=document.createElement("div");
	with(this.od){
		style.position="absolute";
		style.backgroundColor="#DDDCDC";
		style.border="solid 1px #A6A6A6";
		style.padding="1px";
		style.height="120px";
		style.lineHeight="16px";
		style.textAlign="center";
		id=eleID+"_anchor";
	}
	this.templete=('<img id="'+eleID+'" onclick="getVerify(\''+eleID+'\')" style="'+this.imageStylePattern+'" src="' + this.initImageURI +'" alt="图片验证码读取中..." title="点击更换"/><br /><span onclick="getVerify(\''+eleID+'\','+c+')" style="'+this.changeToolStylePattern+'">'+this.changeToolText+'</span>');
	this.seed = function(){
		return Math.random() * 10000
    };
	this.appended=false;
	verifyCounter[eleID]=this;
	this.position = getPosition(this.od);
}
VerifyImage.prototype.showMe=function(basePos, flag){
	this.od.style.display="";
	 
	if(!this.appended){
		document.body.appendChild(this.od);
		this.od.innerHTML= this.templete.replace(/\{\{_random_\}\}/g,this.seed());
		this.appended=true;
	}	
    var p_ = getPosition(this.od);
	with(this.od){
		if(!flag){
		    flag = "top";
		}
		if("top" == flag){
		    style.top= (basePos.top - p_.height) + "px";
			style.left=basePos.left + "px";
	    } else if("left" == flag){
			style.top= (basePos.top) + "px";
		    style.left=(basePos.left + basePos.width) + "px";
		} else if("right" == flag){
		    style.top= (basePos.top) + "px";
		    style.left=(basePos.left - p_.width) + "px";
		} else if("bottom" == flag){
		    style.top= (basePos.top + basePos.height) + "px";
		    style.left=(basePos.left) + "px";
		}
	}
}

VerifyImage.prototype.killMe=function(){
	this.od.style.display="none";
}

VerifyImage.prototype.change=function(){
	var o=get(this.eleID);
	o.src= this.imageURI + this.seed();
}

/*
 *获取验证码
 */
function getVerify(s){ //s,n
	clearTimeout(verifyCounter[s].timeout); //n
	verifyCounter[s].change();
	if(verifyCounter[s].ipt){
		verifyCounter[s].ipt.value="";
		verifyCounter[s].ipt.focus();
	}
}

//input focus获取验证码
function focusGetVerify(o, oId,flag, opt){
	var pos=getPosition(o);
	if(!opt){
	    opt = {changeToolText:'看不清楚？换一个（字母区分大小写）'};
	}
	var el__=(verifyCounter[oId])?(verifyCounter[oId]):(new VerifyImage(oId, opt));
	el__.ipt = o;
	el__.showMe(pos, flag);
	o.value="";
}
//清除验证码信息
function hiddenVerify(s,isImme){
	if(!verifyCounter[s])
		return;
	if(!isImme)
		verifyCounter[s].timeout=setTimeout(function(){verifyCounter[s].killMe()},500);
	else
		verifyCounter[s].killMe();
}