/*
Copyright 2017 Ziadin Givan

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

https://github.com/givanz/VvvebJs
*/

// Simple JavaScript Templating
// John Resig - https://johnresig.com/ - MIT Licensed
(function() {
	var cache = {};

	this.tmpl = function tmpl(str, data) {
		// Figure out if we're getting a template, or if we need to
		// load the template - and be sure to cache the result.
		var fn = /^[-a-zA-Z0-9]+$/.test(str) ?
			cache[str] = cache[str] ||
				tmpl(document.getElementById(str).innerHTML) :

			// Generate a reusable function that will serve as a template
			// generator (and which will be cached).
			new Function('obj',
				'var p=[],print=function(){p.push.apply(p,arguments);};' +

				// Introduce the data as local variables using with(){}
				"with(obj){p.push('" +

				// Convert the template into pure JavaScript
				str
				.replace(/[\r\t\n]/g, ' ')
				.split('{%').join("\t")
				.replace(/((^|%})[^\t]*)'/g, "$1\r")
				.replace(/\t=(.*?)%}/g, "',$1,'")
				.split("\t").join("');")
				.split("%}").join("p.push('")
				.split("\r").join("\\'")
				+ "');}return p.join('');");
		// Provide some basic currying to the user
		return data ? fn(data) : fn;
	};
})();

var delay = (function() {
	var timer = 0;
	return function (callback, ms) {
		clearTimeout(timer);
		timer = setTimeout(callback, ms);
	};
})();

function getStyle(el, styleProp) {
	var value = '';
	//var el = document.getElementById(el);

	if (el.style && el.style.length > 0 && el.style[styleProp]) {
		//check inline
		value = el.style[styleProp];
	} else if (el.currentStyle) {
		//check defined css
		value = el.currentStyle[styleProp];
	} else if (window.getComputedStyle) {
		// noinspection JSUnresolvedVariable
		value = document.defaultView.getDefaultComputedStyle ? document.defaultView.getDefaultComputedStyle(el, null).getPropertyValue(styleProp) : window.getComputedStyle(el, null).getPropertyValue(styleProp);
	}

	return value;
}

function isElement(obj) {
	return (typeof obj === 'object') && (obj.nodeType === 1) && (typeof obj.style === 'object') && (typeof obj.ownerDocument === 'object')/* && obj.tagName != 'BODY'*/;
}

// noinspection JSUnresolvedVariable
var isIE11 = !!window.MSInputMethodContext && !!document.documentMode;

if (typeof Vvveb === 'undefined') {
	var Vvveb = {};
}

Vvveb.defaultComponent = '_base';
Vvveb.preservePropertySections = true;
Vvveb.dragIcon = 'icon';//icon = use component icon when dragging | html = use component html to create draggable element
Vvveb.baseUrl = document.currentScript ? document.currentScript.src.replace(/[^\/]*?\.js$/, '') : '';
Vvveb.ComponentsGroup = {};
Vvveb.BlocksGroup = {};

Vvveb.Components = {
	_components: {},
	_nodesLookup: {},
	_attributesLookup: {},
	_classesLookup: {},
	_classesRegexLookup: {},
	componentPropertiesElement: '#right-panel .component-properties',
	componentPropertiesDefaultSection: 'content',
	get: function (type) {
		return this._components[type];
	},
	add: function (type, data) {
		data.type = type;
		this._components[type] = data;

		if (data.nodes) {
			for (var i in data.nodes) {
				// noinspection JSUnfilteredForInLoop
				this._nodesLookup[data.nodes[i]] = data;
			}
		}

		if (data.attributes) {
			if (data.attributes.constructor === Array) {
				for (var j in data.attributes) {
					// noinspection JSUnfilteredForInLoop
					this._attributesLookup[data.attributes[j]] = data;
				}
			} else {
				for (var k in data.attributes) {
					// noinspection JSUnfilteredForInLoop
					if (typeof this._attributesLookup[k] === 'undefined') {
						// noinspection JSUnfilteredForInLoop
						this._attributesLookup[k] = {};
					}

					// noinspection JSUnfilteredForInLoop
					if (typeof this._attributesLookup[k][data.attributes[k]] === 'undefined') {
						// noinspection JSUnfilteredForInLoop
						this._attributesLookup[k][data.attributes[k]] = {};
					}

					// noinspection JSUnfilteredForInLoop
					this._attributesLookup[k][data.attributes[k]] = data;
				}
			}
		}

		if (data.classes) {
			for (var l in data.classes) {
				// noinspection JSUnfilteredForInLoop
				this._classesLookup[data.classes[l]] = data;
			}
		}

		if (data.classesRegex) {
			for (var m in data.classesRegex) {
				this._classesRegexLookup[data.classesRegex[m]] = data;
			}
		}
	},
	extend: function (inheritType, type, data) {
		var newData = data;
		// noinspection JSUnusedAssignment
		var inheritData = {};

		// noinspection JSAssignmentUsedAsCondition
		if (inheritData = this._components[inheritType]) {
			// noinspection NodeModulesDependencies
			newData = $.extend(true, {}, inheritData, data);
			// noinspection NodeModulesDependencies
			newData.properties = $.merge($.merge([], inheritData.properties ? inheritData.properties : []), data.properties ? data.properties : []);
		}

		//sort by order
		newData.properties.sort(function (a, b) {
			if (typeof a.sort === 'undefined') a.sort = 0;
			if (typeof b.sort === 'undefined') b.sort = 0;

			if (a.sort < b.sort)
				return -1;
			if (a.sort > b.sort)
				return 1;
			return 0;
		});
		/*
		var output = array.reduce(function(o, cur) {

		// Get the index of the key-value pair.
		var occurs = o.reduce(function(n, item, i) {
			return (item.key === cur.key) ? i : n;
		}, -1);

		// If the name is found,
		if (occurs >= 0) {

			// append the current value to its list of values.
			o[occurs].value = o[occurs].value.concat(cur.value);

		// Otherwise,
		} else {

			// add the current item to o (but make sure the value is an array).
			var obj = {name: cur.key, value: [cur.value]};
			o = o.concat([obj]);
		}

		return o;
		}, newData.properties);
		*/

		this.add(type, newData);
	},
	matchNode: function (node) {
		var component = {};
		var attr = null;
		var value = null;

		if (!node || !node.tagName) return false;

		if (node.attributes && node.attributes.length) {
			//search for attributes
			for (var i in node.attributes) {
				// noinspection JSUnfilteredForInLoop
				if (node.attributes[i]) {
					// noinspection JSUnfilteredForInLoop
					attr = node.attributes[i].name;
					// noinspection JSUnfilteredForInLoop
					value = node.attributes[i].value;

					if (attr in this._attributesLookup) {
						component = this._attributesLookup[attr];

						//currently we check that is not a component by looking at name attribute
						//if we have a collection of objects it means that attribute value must be checked
						if (typeof component['name'] === 'undefined') {
							if (value in component) {
								return component[value];
							}
						} else {
							return component;
						}
					}
				}
			}

			for (var j in node.attributes) {
				// noinspection JSUnfilteredForInLoop
				attr = node.attributes[j].name;
				// noinspection JSUnfilteredForInLoop
				value = node.attributes[j].value;

				//check for node classes
				if (attr === 'class') {
					var classes = value.split(' ');

					for (var k in classes) {
						// noinspection JSUnfilteredForInLoop
						if (classes[k] in this._classesLookup) {
							// noinspection JSUnfilteredForInLoop
							return this._classesLookup[classes[k]];
						}
					}

					for (var regex in this._classesRegexLookup) {
						// noinspection JSUnfilteredForInLoop
						var regexObj = new RegExp(regex);

						if (regexObj.exec(value)) {
							// noinspection JSUnfilteredForInLoop
							return this._classesRegexLookup[regex];
						}
					}
				}
			}
		}

		var tagName = node.tagName.toLowerCase();
		if (tagName in this._nodesLookup) return this._nodesLookup[tagName];

		return false;
		//return false;
	},
	render: function (type) {
		var component = this._components[type];

		var componentsPanel = $(this.componentPropertiesElement);
		var defaultSection = this.componentPropertiesDefaultSection;
		var componentsPanelSections = {};

		$('.tab-pane', componentsPanel).each(function() {
			var sectionName = this.id.replace('-tab', '');
			componentsPanelSections[sectionName] = $(this);
		});

		var section = componentsPanelSections[defaultSection].find('.section[data-section="default"]');

		if (!(Vvveb.preservePropertySections && section.length)) {
			componentsPanelSections[defaultSection].html('').append(tmpl('vvveb-input-sectioninput', {key: 'default', header: component.name}));
			section = componentsPanelSections[defaultSection].find('.section');
		}

		componentsPanelSections[defaultSection].find('[data-header="default"] span').html(component.name);
		section.html('');

		if (component.beforeInit) component.beforeInit(Vvveb.Builder.selectedEl.get(0));

		var element = null;

		var fn = function (component, property) {
			return property.input.on('propertyChange', function (event, value, input) {

				element = Vvveb.Builder.selectedEl;

				if (property.child) element = element.find(property.child);
				if (property.parent) element = element.parent(property.parent);

				if (property.onChange) {
					element = property.onChange(element, value, input, component);
				}/* else */
				if (property.htmlAttr) {
					var oldValue = element.attr(property.htmlAttr);

					if (property.htmlAttr === 'class' && property.validValues) {
						element.removeClass(property.validValues.join(' '));
						element = element.addClass(value);
					} else if (property.htmlAttr === 'style') {
						element = element.css(property.key, value);
					} else {
						element = element.attr(property.htmlAttr, value);
					}

					Vvveb.Undo.addMutation({
						type: 'attributes',
						target: element.get(0),
						attributeName: property.htmlAttr,
						oldValue: oldValue,
						newValue: element.attr(property.htmlAttr)
					});
				}

				if (component.onChange) {
					element = component.onChange(element, property, value, input);
				}

				if (!property.child && !property.parent) Vvveb.Builder.selectNode(element);

				return element;
			});
		};

		var nodeElement = Vvveb.Builder.selectedEl;

		for (var i in component.properties) {
			// noinspection JSUnfilteredForInLoop
			var property = component.properties[i];
			element = nodeElement;

			if (property.beforeInit) property.beforeInit(element.get(0));

			if (property.child) element = element.find(property.child);

			if (property.data) {
				property.data['key'] = property.key;
			} else {
				property.data = {'key': property.key};
			}

			if (typeof property.group === 'undefined') {
				property.group = null;
			}

			property.input = property.inputtype.init(property.data);

			if (property.init) {
				property.inputtype.setValue(property.init(element.get(0)));
			} else if (property.htmlAttr) {
				var value = '';

				if (property.htmlAttr === 'style') {
					//value = element.css(property.key);//jquery css returns computed style
					value = getStyle(element.get(0), property.key);//getStyle returns declared style
				} else {
					value = element.attr(property.htmlAttr);
				}

				//if attribute is class check if one of valid values is included as class to set the select
				if (value && property.htmlAttr === 'class' && property.validValues) {
					value = value.split(' ').filter(function (el) {
						return property.validValues.indexOf(el) !== -1
					});
				}

				property.inputtype.setValue(value);
			}

			fn(component, property);

			var propertySection = defaultSection;

			if (property.section) {
				propertySection = property.section;
			}

			if (property.inputtype === SectionInput) {
				section = componentsPanelSections[propertySection].find('.section[data-section="' + property.key + '"]');

				if (Vvveb.preservePropertySections && section.length) {
					section.html('');
				} else {
					componentsPanelSections[propertySection].append(property.input);
					section = componentsPanelSections[propertySection].find('.section[data-section="' + property.key + '"]');
				}
			} else {
				var row = $(tmpl('vvveb-property', property));
				row.find('.input').append(property.input);
				section.append(row);
			}

			// noinspection JSUnresolvedVariable
			if (property.inputtype.afterInit) {
				// noinspection JSUnresolvedFunction
				property.inputtype.afterInit(property.input);
			}
		}

		if (component.init) component.init(Vvveb.Builder.selectedEl.get(0));
	}
};

Vvveb.Blocks = {
	_blocks: {},
	get: function (type) {
		return this._blocks[type];
	},
	add: function (type, data) {
		data.type = type;
		this._blocks[type] = data;
	}
};

Vvveb.WysiwygEditor = {
	isActive: false,
	oldValue: '',
	doc: false,
	init: function (doc) {
		this.doc = doc;

		$('#bold-btn').on('click', function (e) {
			doc.execCommand('bold', false, null);
			e.preventDefault();
			return false;
		});

		$('#italic-btn').on('click', function (e) {
			doc.execCommand('italic', false, null);
			e.preventDefault();
			return false;
		});

		$('#underline-btn').on('click', function (e) {
			doc.execCommand('underline', false, null);
			e.preventDefault();
			return false;
		});

		$('#strike-btn').on('click', function (e) {
			doc.execCommand('strikeThrough', false, null);
			e.preventDefault();
			return false;
		});

		$('#link-btn').on('click', function (e) {
			doc.execCommand('createLink', false, '#');
			e.preventDefault();
			return false;
		});
	},
	undo: function() {
		this.doc.execCommand('undo', false, null);
	},
	redo: function() {
		this.doc.execCommand('redo', false, null);
	},
	edit: function (element) {
		element.attr({'contenteditable': true, 'spellcheckker': false});
		$('#wysiwyg-editor').show();

		this.element = element;
		this.isActive = true;
		this.oldValue = element.html();
	},
	destroy: function (element) {
		element.removeAttr('contenteditable spellcheckker');
		$('#wysiwyg-editor').hide();
		this.isActive = false;

		var node = this.element.get(0);

		Vvveb.Undo.addMutation({
			type: 'characterData',
			target: node,
			oldValue: this.oldValue,
			newValue: node.innerHTML
		});
	}
};

Vvveb.Builder = {
	component: {},
	dragMoveMutation: false,
	isPreview: false,
	runJsOnSetHtml: false,
	designerMode: false,
	init: function (url, callback) {
		var self = this;

		self.loadControlGroups();
		self.loadBlockGroups();

		self.selectedEl = null;
		self.highlightEl = null;
		self.initCallback = callback;

		self.documentFrame = $('#iframe-wrapper > iframe');
		self.canvas = $('#canvas');

		self._loadIframe(url);

		self._initDragdrop();

		self._initBox();

		self.dragElement = null;
	},
	/* controls */
	loadControlGroups: function() {
		var componentsList = $('.components-list');
		componentsList.empty();
		var item = {}, component = {};

		componentsList.each(function() {
			var list = $(this);
			var type = this.dataset.type;

			for (var group in Vvveb.ComponentsGroup) {
				list.append('<li class="header clearfix" data-section="' + group + '" data-search=""><label class="header" for="' + type + '_comphead_' + group + '">' + group + '<div class="header-arrow"></div></label><input class="header_check" type="checkbox" checked="true" id="' + type + '_comphead_' + group + '"><ol></ol></li>');

				var componentsSubList = list.find('li[data-section="' + group + '"] ol');

				// noinspection JSUnfilteredForInLoop
				var components = Vvveb.ComponentsGroup[group];

				for (var i in components) {
					// noinspection JSUnfilteredForInLoop
					var componentType = components[i];
					component = Vvveb.Components.get(componentType);

					if (component) {
						item = $('<li data-section="' + group + '" data-drag-type=component data-type="' + componentType + '" data-search="' + component.name.toLowerCase() + '"><a href="#">' + component.name + "</a></li>");

						if (component.image) {

							item.css({
								backgroundImage: 'url(' + 'libs/builder/' + component.image + ')',
								backgroundRepeat: 'no-repeat'
							})
						}

						componentsSubList.append(item)
					}
				}
			}
		});
	},
	loadBlockGroups: function() {
		var blocksList = $('.blocks-list');
		blocksList.empty();
		var item = {};

		blocksList.each(function() {
			var list = $(this);
			var type = this.dataset.type;

			for (var group in Vvveb.BlocksGroup) {
				list.append('<li class="header" data-section="' + group + '" data-search=""><label class="header" for="' + type + '_blockhead_' + group + '">' + group + '<div class="header-arrow"></div></label><input class="header_check" type="checkbox" checked="true" id="' + type + '_blockhead_' + group + '"><ol></ol></li>');

				var blocksSubList = list.find('li[data-section="' + group + '"] ol');
				// noinspection JSUnfilteredForInLoop
				var blocks = Vvveb.BlocksGroup[group];

				for (var i in blocks) {
					// noinspection JSUnfilteredForInLoop
					var blockType = blocks[i];
					var block = Vvveb.Blocks.get(blockType);

					if (block) {
						item = $('<li data-section="' + group + '" data-drag-type=block data-type="' + blockType + '" data-search="' + block.name.toLowerCase() + '"><a href="#">' + block.name + "</a></li>");

						if (block.image) {

							item.css({
								backgroundImage: 'url(' + ((block.image.indexOf('//') === -1) ? 'libs/builder/' : '') + block.image + ')',
								backgroundRepeat: 'no-repeat'
							})
						}

						blocksSubList.append(item)
					}
				}
			}
		});
	},
	loadUrl: function (url, callback) {
		var self = this;
		$('#select-box').hide();
		self.initCallback = callback;
		if (Vvveb.Builder.iframe.src !== url) Vvveb.Builder.iframe.src = url;
	},
	/* iframe */
	_loadIframe: function (url) {
		var self = this;
		self.iframe = this.documentFrame.get(0);
		self.iframe.src = url;

		return this.documentFrame.on('load', function() {
			window.FrameWindow = self.iframe.contentWindow;
			window.FrameDocument = self.iframe.contentWindow.document;
			var addSectionBox = $('#add-section-box');
			var offset = 0;

			$(window.FrameWindow).on('beforeunload', function (event) {
				if (Vvveb.Undo.undoIndex <= 0) {
					var dialogText = 'You have unsaved changes';
					event.returnValue = dialogText;
					return dialogText;
				}
			});

			$(window.FrameWindow).on('scroll resize', function () {
				if (self.selectedEl) {
					offset = self.selectedEl.offset();

					$('#select-box').css({
						top: offset.top - self.frameDoc.scrollTop(),
						left: offset.left - self.frameDoc.scrollLeft(),
						width: self.selectedEl.outerWidth(),
						height: self.selectedEl.outerHeight()
						//display: 'block'
					});
				}

				if (self.highlightEl) {
					offset = self.highlightEl.offset();

					$('#highlight-box').css({
						top: offset.top - self.frameDoc.scrollTop(),
						left: offset.left - self.frameDoc.scrollLeft(),
						width: self.highlightEl.outerWidth(),
						height: self.highlightEl.outerHeight()
						//display: 'block'
					});

					addSectionBox.hide();
				}
			});

			Vvveb.WysiwygEditor.init(window.FrameDocument);
			if (self.initCallback) self.initCallback();

			return self._frameLoaded();
		});
	},
	_frameLoaded: function() {
		var self = Vvveb.Builder;

		self.frameDoc = $(window.FrameDocument);
		self.frameHtml = $(window.FrameDocument).find('html');
		self.frameBody = $(window.FrameDocument).find('body');
		self.frameHead = $(window.FrameDocument).find('head');

		//insert editor helpers like non editable areas
		self.frameHead.append('<link data-vvveb-helpers href="' + Vvveb.baseUrl + '../../css/vvvebjs-editor-helpers.css" rel="stylesheet">');

		self._initHighlight();
	},
	_getElementType: function (el) {
		//search for component attribute
		var componentName = '';

		if (el.attributes)
			for (var j = 0; j < el.attributes.length; j++) {

				if (el.attributes[j].nodeName.indexOf('data-component') > -1) {
					componentName = el.attributes[j].nodeName.replace('data-component-', '');
				}
			}

		if (componentName !== '') return componentName;

		return el.tagName;
	},
	loadNodeComponent: function (node) {
		var data = Vvveb.Components.matchNode(node);
		var component;

		if (data) {
			component = data.type;
		} else {
			component = Vvveb.defaultComponent;
		}

		Vvveb.Components.render(component);
	},
	selectNode: function (node) {
		var self = this;

		if (!node) {
			$('#select-box').hide();
			return;
		}

		if (self.texteditEl && self.selectedEl.get(0) !== node) {
			Vvveb.WysiwygEditor.destroy(self.texteditEl);
			$('#select-box').removeClass('text-edit').find('#select-actions').show();
			self.texteditEl = null;
		}

		var target = $(node);

		if (target) {
			self.selectedEl = target;

			try {
				var offset = target.offset();

				$('#select-box').css({
					top: offset.top - self.frameDoc.scrollTop(),
					left: offset.left - self.frameDoc.scrollLeft(),
					width: target.outerWidth(),
					height: target.outerHeight(),
					display: 'block'
				});
			} catch (err) {
				console.log(err);
				return false;
			}
		}

		$('#highlight-name').html(this._getElementType(node));
	},
	/* iframe highlight */
	_initHighlight: function() {
		var self = Vvveb.Builder;

		self.frameHtml.on('mousemove touchmove', function (event) {
			if (event.target && isElement(event.target) && event.originalEvent) {
				self.highlightEl = $(event.target);
				var target = self.highlightEl;
				var offset = target.offset();
				var height = target.outerHeight();
				var halfHeight = Math.max(height / 2, 50);
				var width = target.outerWidth();
				var halfWidth = Math.max(width / 2, 50);

				var x = (event.clientX || event.originalEvent.clientX);
				var y = (event.clientY || event.originalEvent.clientY);

				if (self.isDragging) {
					var parent = self.highlightEl;

					try {
						if (event.originalEvent) {
							if ((offset.top < (y - halfHeight)) || (offset.left < (x - halfWidth))) {
								if (isIE11) {
									self.highlightEl.append(self.dragElement);
								} else {
									self.dragElement.appendTo(parent);
								}
							} else {
								if (isIE11) {
									self.highlightEl.prepend(self.dragElement);
								} else {
									self.dragElement.prependTo(parent);
								}
							}

							if (self.designerMode) {
								var parentOffset = self.dragElement.offsetParent().offset();

								self.dragElement.css({
									position: 'absolute',
									left: x - (parentOffset.left - self.frameDoc.scrollLeft()),
									top: y - (parentOffset.top - self.frameDoc.scrollTop())
								});
							}
						}
					} catch (err) {
						console.log(err);
						return false;
					}

					if (!self.designerMode && self.iconDrag) self.iconDrag.css({'left': x + 275/*left panel width*/, 'top': y - 30});
				}// else //uncomment else to disable parent highlighting when dragging
				{
					$('#highlight-box').css({
						top: offset.top - self.frameDoc.scrollTop(),
						left: offset.left - self.frameDoc.scrollLeft(),
						width: width,
						height: height,
						display: event.target.hasAttribute('contenteditable') ? 'none' : 'block',
						border: self.isDragging ? '1px dashed aqua' : '' //when dragging highlight parent with green
					}).html(self._getElementType(event.target));

					if (self.isDragging) $('#highlight-name').hide(); else $('#highlight-name').show(); //hide tag name when dragging
				}
			}
		});

		self.frameHtml.on('mouseup touchend', function() {
			if (self.isDragging) {
				self.isDragging = false;

				if (self.iconDrag) {
					self.iconDrag.remove();
				}

				$('#component-clone').remove();

				//if dragHtml is set for dragging then set real component html
				if (self.component.dragHtml) {
					var newElement = $(self.component.html);
					self.dragElement.replaceWith(newElement);
					self.dragElement = newElement;
				}

				// noinspection JSUnresolvedVariable
				if (self.component.afterDrop) self.dragElement = self.component.afterDrop(self.dragElement);

				self.dragElement.css('border', '');

				var node = self.dragElement.get(0);
				self.selectNode(node);
				self.loadNodeComponent(node);

				if (self.dragMoveMutation === false) {
					Vvveb.Undo.addMutation({
						type: 'childList',
						target: node.parentNode,
						addedNodes: [node],
						nextSibling: node.nextSibling
					});
				} else {
					self.dragMoveMutation.newParent = node.parentNode;
					self.dragMoveMutation.newNextSibling = node.nextSibling;

					Vvveb.Undo.addMutation(self.dragMoveMutation);
					self.dragMoveMutation = false;
				}
			}
		});

		self.frameHtml.on('dblclick', function (event) {
			if (Vvveb.Builder.isPreview === false) {
				self.texteditEl = $(event.target);

				var target = self.texteditEl;

				Vvveb.WysiwygEditor.edit(target);

				self.texteditEl.attr({contenteditable: true, spellcheckker: false});

				self.texteditEl.on('blur keyup paste input', function() {
					$('#select-box').css({
						width: target.outerWidth(),
						height: target.outerHeight()
					});
				});

				$('#select-box').addClass('text-edit').find('#select-actions').hide();
				$('#highlight-box').hide();
			}
		});

		self.frameHtml.on('click', function (event) {
			if (Vvveb.Builder.isPreview === false) {
				//if component properties is loaded in left panel tab instead of right panel show tab
				if (event.target) {
					//if properites tab is enabled/visible
					if ($('.component-properties-tab').is(':visible')) {
						$('.component-properties-tab a').show().tab('show');
					}

					self.selectNode(event.target);
					self.loadNodeComponent(event.target);
				}

				event.preventDefault();
				return false;
			}
		});
	},
	_initBox: function() {
		var self = this;

		$('#drag-btn').on('mousedown', function (event) {
			$('#select-box').hide();
			self.dragElement = self.selectedEl.css('position', '');
			self.isDragging = true;

			var node = self.dragElement.get(0);

			self.dragMoveMutation = {
				type: 'move',
				target: node,
				oldParent: node.parentNode,
				oldNextSibling: node.nextSibling
			};

			//self.selectNode(false);
			event.preventDefault();
			return false;
		});

		$('#down-btn').on('click', function (event) {
			$('#select-box').hide();

			var node = self.selectedEl.get(0);
			var oldParent = node.parentNode;
			var oldNextSibling = node.nextSibling;

			var next = self.selectedEl.next();

			if (next.length > 0) {
				next.after(self.selectedEl);
			} else {
				self.selectedEl.parent().after(self.selectedEl);
			}

			var newParent = node.parentNode;
			var newNextSibling = node.nextSibling;

			Vvveb.Undo.addMutation({
				type: 'move',
				target: node,
				oldParent: oldParent,
				newParent: newParent,
				oldNextSibling: oldNextSibling,
				newNextSibling: newNextSibling
			});

			event.preventDefault();
			return false;
		});

		$('#up-btn').on('click', function (event) {
			$('#select-box').hide();

			var node = self.selectedEl.get(0);
			var oldParent = node.parentNode;
			var oldNextSibling = node.nextSibling;

			var next = self.selectedEl.prev();

			if (next.length > 0) {
				next.before(self.selectedEl);
			} else {
				self.selectedEl.parent().before(self.selectedEl);
			}

			var newParent = node.parentNode;
			var newNextSibling = node.nextSibling;

			Vvveb.Undo.addMutation({
				type: 'move',
				target: node,
				oldParent: oldParent,
				newParent: newParent,
				oldNextSibling: oldNextSibling,
				newNextSibling: newNextSibling
			});

			event.preventDefault();
			return false;
		});

		$('#clone-btn').on('click', function (event) {

			var clone = self.selectedEl.clone();
			self.selectedEl.after(clone);
			self.selectedEl = clone.click();

			var node = clone.get(0);

			Vvveb.Undo.addMutation({
				type: 'childList',
				target: node.parentNode,
				addedNodes: [node],
				nextSibling: node.nextSibling
			});

			event.preventDefault();
			return false;
		});

		$('#parent-btn').on('click', function (event) {
			var node = self.selectedEl.parent().get(0);

			self.selectNode(node);
			self.loadNodeComponent(node);

			event.preventDefault();
			return false;
		});

		$('#delete-btn').on('click', function (event) {
			$('#select-box').hide();

			var node = self.selectedEl.get(0);

			Vvveb.Undo.addMutation({
				type: 'childList',
				target: node.parentNode,
				removedNodes: [node],
				nextSibling: node.nextSibling
			});

			self.selectedEl.remove();

			event.preventDefault();
			return false;
		});

		var addSectionBox = $('#add-section-box');
		var addSectionElement = {};

		$('#add-section-btn').on('click', function (event) {
			addSectionElement = self.highlightEl;

			var offset = $(addSectionElement).offset();

			addSectionBox.css({
				top: (offset.top - self.frameDoc.scrollTop()) + addSectionElement.outerHeight(),
				left: (offset.left - self.frameDoc.scrollLeft()) + (addSectionElement.outerWidth() / 2) - (addSectionBox.outerWidth() / 2),
				display: 'block'
			});

			event.preventDefault();
			return false;
		});

		$('#close-section-btn').on('click', function() {
			addSectionBox.hide();
		});

		function addSectionComponent(html, after) {
			if (typeof after === 'undefined') {
				after = true;
			}

			var node = $(html);

			if (after) {
				addSectionElement.after(node);
			} else {
				addSectionElement.append(node);
			}

			node = node.get(0);

			Vvveb.Undo.addMutation({
				type: 'childList',
				target: node.parentNode,
				addedNodes: [node],
				nextSibling: node.nextSibling
			});
		}

		$('.components-list li ol li', addSectionBox).on('click', function() {
			var html = Vvveb.Components.get(this.dataset.type).html;

			addSectionComponent(html, ($('[name="add-section-insert-mode"]:checked').val() === 'after'));

			addSectionBox.hide();
		});

		$('.blocks-list li ol li', addSectionBox).on('click', function() {
			var html = Vvveb.Blocks.get(this.dataset.type).html;

			addSectionComponent(html, ($('[name="add-section-insert-mode"]:checked').val() === 'after'));

			addSectionBox.hide();
		});
	},
	/* drag and drop */
	_initDragdrop: function() {
		var self = this;
		self.isDragging = false;

		$('.drag-elements-sidepane ul > li > ol > li').on('mousedown touchstart', function (event) {
			var $this = $(this);

			$('#component-clone').remove();

			if ($this.data('drag-type') === 'component') {
				self.component = Vvveb.Components.get($this.data('type'));
			} else {
				self.component = Vvveb.Blocks.get($this.data('type'));
			}

			if (self.component.dragHtml) {
				html = self.component.dragHtml;
			} else {
				html = self.component.html;
			}

			self.dragElement = $(html);
			self.dragElement.css('border', '1px dashed #4285f4');

			if (self.component.dragStart) {
				self.dragElement = self.component.dragStart(self.dragElement);
			}

			self.isDragging = true;

			if (Vvveb.dragIcon === 'html') {
				self.iconDrag = $(html).attr('id', 'dragElement-clone').css('position', 'absolute');
			} else if (self.designerMode === false) {
				self.iconDrag = $('<img src="" alt=""/>').attr({id: 'dragElement-clone', src: $this.css('background-image').replace(/^url\(['"](.+)['"]\)/, '$1')}).css({'z-index': 100, position: 'absolute', width: '64px', height: '64px', top: event.originalEvent.y, left: event.originalEvent.x});
			}

			$('body').append(self.iconDrag);

			event.preventDefault();
			return false;
		});

		$('body').on('mouseup touchend', function() {
			if (self.iconDrag && self.isDragging === true) {
				self.isDragging = false;

				$('#component-clone').remove();
				self.iconDrag.remove();

				if (self.dragElement) {
					self.dragElement.remove();
				}
			}
		}).on('mousemove touchmove', function (event) {
			if (self.iconDrag && self.isDragging === true) {
				var x = (event.clientX || event.originalEvent.clientX);
				var y = (event.clientY || event.originalEvent.clientY);

				self.iconDrag.css({'left': x - 60, 'top': y - 30});

				var elementMouseIsOver = document.elementFromPoint(x - 60, y - 40);

				//if drag elements hovers over iframe switch to iframe mouseover handler
				if (elementMouseIsOver && elementMouseIsOver.tagName === 'IFRAME') {
					self.frameBody.trigger('mousemove', event);
					event.stopPropagation();
					self.selectNode(false);
				}
			}
		});

		$('.drag-elements-sidepane ul > ol > li > li').on('mouseup touchend', function() {
			self.isDragging = false;
			$('#component-clone').remove();
		});
	},
	removeHelpers: function (html, keepHelperAttributes) {
		if (typeof keepHelperAttributes === 'undefined') {
			keepHelperAttributes = false;
		}

		//tags like stylesheets or scripts
		html = html.replace(/<.*?data-vvveb-helpers.*?>/gi, '');

		//attributes
		if (!keepHelperAttributes) {
			html = html.replace(/\s*data-vvveb-\w+(=["'].*?["'])?\s*/gi, '');
		}

		return html;
	},
	getHtml: function (keepHelperAttributes) {
		if (typeof keepHelperAttributes === 'undefined') {
			keepHelperAttributes = true;
		}

		var doc = window.FrameDocument;
		var hasDoctpe = (doc.doctype !== null);
		var html = '';

		if (hasDoctpe) html =
			'<!DOCTYPE '
			+ doc.doctype.name
			+ (doc.doctype.publicId ? ' PUBLIC "' + doc.doctype.publicId + '"' : '')
			+ (!doc.doctype.publicId && doc.doctype.systemId ? ' SYSTEM' : '')
			+ (doc.doctype.systemId ? ' "' + doc.doctype.systemId + '"' : '')
			+ ">\n";

		html += doc.documentElement.innerHTML + "\n</html>";

		return this.removeHelpers(html, keepHelperAttributes);
	},
	setHtml: function (html) {
		//update only body to avoid breaking iframe css/js relative paths
		var start = html.indexOf('<body');
		var end = html.indexOf('</body');

		var body = '';

		if (start >= 0 && end >= 0) {
			body = html.slice(html.indexOf('>', start) + 1, end);
		} else {
			body = html;
		}

		if (this.runJsOnSetHtml) {
			self.frameBody.html(body);
		} else {
			window.FrameDocument.body.innerHTML = body;
		}

		//below methods brake document relative css and js paths
		//return self.iframe.outerHTML = html;
		//return self.documentFrame.html(html);
		//return self.documentFrame.attr('srcdoc', html);
	},
	saveAjax: function (fileName, startTemplateUrl, callback) {
		var data = {};
		data['fileName'] = (fileName && fileName !== '') ? fileName : Vvveb.FileManager.getCurrentUrl();
		data['startTemplateUrl'] = startTemplateUrl;

		if (!startTemplateUrl) {
			data['html'] = this.getHtml();
		}

		$.ajax({
			type: 'POST',
			url: 'save.php',//set your server side save script url
			data: data,
			cache: false,
			success: function (data) {
				if (callback) {
					callback(data);
				}
			},
			error: function (data) {
				alert(data.responseText);
			}
		});
	},
	setDesignerMode: function (designerMode) {
		if (typeof designerMode === 'undefined') {
			designerMode = false;
		}

		this.designerMode = designerMode;
	}
};

Vvveb.CodeEditor = {
	isActive: false,
	oldValue: '',
	doc: false,
	init: function() {
		$('#vvveb-code-editor textarea').val(Vvveb.Builder.getHtml()).on('keyup', function() {
			delay(Vvveb.Builder.setHtml(this.value), 1000);
		});

		//load code on document changes
		Vvveb.Builder.frameBody.on('vvveb.undo.add vvveb.undo.restore', function() {
			Vvveb.CodeEditor.setValue();
		});

		//load code when a new url is loaded
		Vvveb.Builder.documentFrame.on('load', function() {
			Vvveb.CodeEditor.setValue();
		});

		this.isActive = true;
	},
	setValue: function () {
		if (this.isActive) {
			$('#vvveb-code-editor textarea').val(Vvveb.Builder.getHtml());
		}
	},
	destroy: function (element) {
		//this.isActive = false;
	},
	toggle: function() {
		if (this.isActive !== true) {
			this.isActive = true;

			return this.init();
		}
		this.isActive = false;
		this.destroy();
	}
};

// noinspection JSUnusedGlobalSymbols
Vvveb.Gui = {
	init: function() {
		$('[data-vvveb-action]').each(function() {
			var on = 'click';

			// noinspection JSUnresolvedVariable
			if (this.dataset.vvvebOn) {
				// noinspection JSUnresolvedVariable
				on = this.dataset.vvvebOn;
			}

			// noinspection JSUnresolvedVariable
			$(this).on(on, Vvveb.Gui[this.dataset.vvvebAction]);

			// noinspection JSUnresolvedVariable
			if (this.dataset.vvvebShortcut) {
				// noinspection JSUnresolvedVariable
				$(document).on('keydown', this.dataset.vvvebShortcut, Vvveb.Gui[this.dataset.vvvebAction]);
				// noinspection JSUnresolvedVariable
				$(window.FrameDocument, window.FrameWindow).on('keydown', this.dataset.vvvebShortcut, Vvveb.Gui[this.dataset.vvvebAction]);
			}
		});
	},
	undo: function() {
		if (Vvveb.WysiwygEditor.isActive) {
			Vvveb.WysiwygEditor.undo();
		} else {
			Vvveb.Undo.undo();
		}

		Vvveb.Builder.selectNode();
	},
	redo: function() {
		if (Vvveb.WysiwygEditor.isActive) {
			Vvveb.WysiwygEditor.redo();
		} else {
			Vvveb.Undo.redo();
		}

		Vvveb.Builder.selectNode();
	},
	//show modal with html content
	save: function() {
		$('#textarea-modal textarea').val(Vvveb.Builder.getHtml());
		$('#textarea-modal').modal();
	},
	//post html content through ajax to save to filesystem/db
	saveAjax: function() {
		var url = Vvveb.FileManager.getCurrentUrl();

		return Vvveb.Builder.saveAjax(url, null, function (data) {
			$('#message-modal').modal().find('.modal-body').html('File saved at: ' + data);
		});
	},
	download: function() {
		var filename = /[^\/]+$/.exec(Vvveb.Builder.iframe.src)[0];
		var uriContent = 'data:application/octet-stream,' + encodeURIComponent(Vvveb.Builder.getHtml());

		var link = document.createElement('a');

		if ('download' in link) {
			link.dataset.download = filename;
			link.href = uriContent;
			link.target = '_blank';

			document.body.appendChild(link);
			result = link.click();
			document.body.removeChild(link);
			link.remove();
		} else {
			location.href = uriContent;
		}
	},
	viewport: function() {
		$('#canvas').attr('class', this.dataset.view);
	},
	toggleEditor: function() {
		$('#vvveb-builder').toggleClass('bottom-panel-expand');
		$('#toggleEditorJsExecute').toggle();
		Vvveb.CodeEditor.toggle();
	},
	toggleEditorJsExecute: function() {
		Vvveb.Builder.runJsOnSetHtml = this.checked;
	},
	preview: function() {
		(Vvveb.Builder.isPreview === true) ? Vvveb.Builder.isPreview = false : Vvveb.Builder.isPreview = true;
		$('#iframe-layer').toggle();
		$('#vvveb-builder').toggleClass('preview');
	},
	fullscreen: function() {
		// the whole page
		launchFullScreen(document);
	},
	componentSearch: function() {
		var searchText = this.value;

		$('#left-panel .components-list li ol li').each(function() {
			var $this = $(this);

			$this.hide();
			if ($this.data('search').indexOf(searchText) > -1) $this.show();
		});
	},
	clearComponentSearch: function() {
		$('.component-search').val('').keyup();
	},
	blockSearch: function() {
		var searchText = this.value;

		$('#left-panel .blocks-list li ol li').each(function() {
			var $this = $(this);

			$this.hide();

			if ($this.data('search').indexOf(searchText) > -1) {
				$this.show();
			}
		});
	},
	clearBlockSearch: function() {
		$('.block-search').val('').keyup();
	},
	addBoxComponentSearch: function() {
		var searchText = this.value;

		$('#add-section-box .components-list li ol li').each(function() {
			var $this = $(this);

			$this.hide();

			if ($this.data('search').indexOf(searchText) > -1) {
				$this.show();
			}
		});
	},
	addBoxBlockSearch: function() {
		var searchText = this.value;

		$('#add-section-box .blocks-list li ol li').each(function() {
			var $this = $(this);

			$this.hide();

			if ($this.data('search').indexOf(searchText) > -1) {
				$this.show();
			}
		});
	},
	//Pages, file/components tree
	newPage: function() {
		var newPageModal = $('#new-page-modal');

		newPageModal.modal('show').find('form').off('submit').submit(function (event) {
			var title = $('input[name="title"]', newPageModal).val();
			var startTemplateUrl = $('select[name="startTemplateUrl"]', newPageModal).val();
			var fileName = $('input[name="fileName"]', newPageModal).val();

			//replace nonalphanumeric with dashes and lowercase for name
			var name = title.replace(/\W+/g, '-').toLowerCase();
			//allow only alphanumeric, dot char for extension (eg .html) and / to allow typing full path including folders
			fileName = fileName.replace(/[^A-Za-z0-9.\/]+/g, '-').toLowerCase();

			//add your server url/prefix/path if needed
			var url = '' + fileName;

			Vvveb.FileManager.addPage(name, title, url);
			event.preventDefault();

			return Vvveb.Builder.saveAjax(url, startTemplateUrl, function() {
				Vvveb.FileManager.loadPage(name);
				Vvveb.FileManager.scrollBottom();
				newPageModal.modal('hide');
			});
		});
	},
	deletePage: function() {},
	setDesignerMode: function() {
		//aria-pressed attribute is updated after action is called and we check for false instead of true
		var designerMode = this.attributes['aria-pressed'].value !== 'true';
		Vvveb.Builder.setDesignerMode(designerMode);
	},
	//layout
	togglePanel: function (panel, cssVar) {
		panel = $(panel);

		var body = $('body');
		var prevValue = body.css(cssVar);

		if (prevValue !== '0px') {
			panel.data('layout-toggle', prevValue);
			body.css(cssVar, '0px');
			panel.hide();
		} else {
			prevValue = panel.data('layout-toggle');
			body.css(cssVar, prevValue);
			panel.show();
		}
	},
	toggleFileManager: function() {
		Vvveb.Gui.togglePanel('#filemanager', '--builder-filemanager-height');
	},
	toggleLeftColumn: function() {
		Vvveb.Gui.togglePanel('#left-panel', '--builder-left-panel-width');
	},
	toggleRightColumn: function() {
		Vvveb.Gui.togglePanel('#right-panel', '--builder-right-panel-width');
		var rightColumnEnabled = this.attributes['aria-pressed'].value === 'true';

		$('#vvveb-builder').toggleClass('no-right-panel');
		$('.component-properties-tab').toggle();

		Vvveb.Components.componentPropertiesElement = (rightColumnEnabled ? '#right-panel' : '#left-panel') + ' .component-properties';
		if ($('#properties').is(':visible')) $('.component-tab a').show().tab('show');
	}
};

// noinspection JSUnusedGlobalSymbols
Vvveb.FileManager = {
	tree: false,
	pages: {},
	currentPage: false,
	init: function() {
		this.tree = $('#filemanager .tree > ol').html('');
		$(this.tree).on('click', 'a', function (e) {
			e.preventDefault();
			return false;
		});
		$(this.tree).on('click', 'li[data-page] label', function() {
			var page = $(this.parentNode).data('page');

			if (page) {
				Vvveb.FileManager.loadPage(page);
			}

			return false;
		});
		$(this.tree).on('click', 'li[data-component] label ', function (e) {
			var node = $(e.currentTarget.parentNode).data('node');

			Vvveb.Builder.frameHtml.animate({
				scrollTop: $(node).offset().top
			}, 1000);

			Vvveb.Builder.selectNode(node);
			Vvveb.Builder.loadNodeComponent(node);

			//e.preventDefault();
			//return false;
		}).on('mouseenter', 'li[data-component] label', function (e) {
			var node = $(e.currentTarget).data('node');
			$(node).trigger('mousemove');
		});
	},
	addPage: function (name, title, url) {
		this.pages[name] = {title: title, url: url};
		this.tree.append(tmpl('vvveb-filemanager-page', {name: name, title: title, url: url}));
	},
	addPages: function (pages) {
		for (var page in pages) {
			// noinspection JSUnfilteredForInLoop
			this.addPage(pages[page]['name'], pages[page]['title'], pages[page]['url']);
		}
	},
	addComponent: function (name, url, title, page) {
		$('[data-page="' + page + '"] > ol', this.tree).append(
			tmpl('vvveb-filemanager-component', {name: name, url: url, title: title}));
	},
	getComponents: function (allowedComponents) {
		if (typeof allowedComponents === 'undefined') {
			allowedComponents = {};
		}

		var tree = [];

		function getNodeTree(node, parent) {
			if (node.hasChildNodes()) {
				for (var j = 0; j < node.childNodes.length; j++) {
					var child = node.childNodes[j];

					if (child && typeof child['attributes'] !== 'undefined') {
						var matchChild = Vvveb.Components.matchNode(child);

						if (Array.isArray(allowedComponents) && allowedComponents.indexOf(matchChild.type) === -1) {
							continue;
						}

						var element = {
							name: matchChild.name,
							image: matchChild.image,
							type: matchChild.type,
							node: child,
							children: []
						};

						element.children = [];
						parent.push(element);
						element = getNodeTree(child, element.children);
					} else {
						element = getNodeTree(child, parent);
					}
				}
			}

			return false;
		}

		getNodeTree(window.FrameDocument.body, tree);

		return tree;
	},
	loadComponents: function (allowedComponents) {
		if (typeof allowedComponents === 'undefined') {
			allowedComponents = {};
		}

		var tree = this.getComponents(allowedComponents);
		html = drawComponentsTree(tree);

		function drawComponentsTree(tree) {
			var html = $('<ol></ol>');
			var j = 0;

			for (var i in tree) {
				j++;
				// noinspection JSUnfilteredForInLoop
				var node = tree[i];
				var li;

				// noinspection JSUnfilteredForInLoop
				if (tree[i].children.length > 0) {
					// noinspection CssUnknownTarget
					li = $('<li data-component="' + node.name + '"><label for="id' + j + '" style="background-image:url(libs/builder/' + node.image + ')"><span>' + node.name + '</span></label><input type="checkbox" id="id' + j + '"></li>');
					li.data('node', node.node);
					li.append(drawComponentsTree(node.children));
					html.append(li);
				} else {
					// noinspection CssUnknownTarget
					li = $('<li data-component="' + node.name + '" class="file"><label for="id' + j + '" style="background-image:url(libs/builder/' + node.image + ')"><span>' + node.name + '</span></label><input type="checkbox" id="id' + j + '"></li>');
					li.data('node', node.node);
					html.append(li);
				}
			}

			return html;
		}

		$('[data-page="' + this.currentPage + '"] > ol', this.tree).replaceWith(html);
	},
	getCurrentUrl: function() {
		if (this.currentPage) {
			return this.pages[this.currentPage]['url'];
		}
	},
	reloadCurrentPage: function() {
		if (this.currentPage) {
			return this.loadPage(this.currentPage);
		}
	},
	loadPage: function (name, allowedComponents, disableCache) {
		if (typeof allowedComponents === 'undefined') {
			allowedComponents = false;
		}

		if (typeof disableCache === 'undefined') {
			disableCache = true;
		}

		$('[data-page]', this.tree).removeClass('active');
		$('[data-page="' + name + '"]', this.tree).addClass('active');

		this.currentPage = name;
		var url = this.pages[name]['url'];

		Vvveb.Builder.loadUrl(url + (disableCache ? (url.indexOf('?') > -1 ? '&' : '?') + Math.random() : ''), function() {
			Vvveb.FileManager.loadComponents(allowedComponents);
		});
	},
	scrollBottom: function() {
		var scroll = this.tree.parent();
		scroll.scrollTop(scroll.prop('scrollHeight'));
	}
};

// Toggle fullscreen
function launchFullScreen(document) {
	// noinspection JSUnresolvedVariable
	if (document.documentElement.requestFullScreen) {
		// noinspection JSUnresolvedVariable
		if (document.FullScreenElement) {
			// noinspection JSUnresolvedFunction
			document.exitFullScreen();
		} else {
			document.documentElement.requestFullScreen();
		}
	} else {
		//mozilla
		// noinspection JSUnresolvedVariable
		if (document.documentElement.mozRequestFullScreen) {
			// noinspection JSUnresolvedVariable
			if (document.mozFullScreenElement) {
				// noinspection JSUnresolvedFunction
				document.mozCancelFullScreen();
			} else {
				document.documentElement.mozRequestFullScreen();
			}
		} else {
			//webkit
			// noinspection JSUnresolvedVariable
			if (document.documentElement.webkitRequestFullScreen) {
				// noinspection JSUnresolvedVariable
				if (document.webkitFullscreenElement) {
					// noinspection JSUnresolvedFunction
					document.webkitExitFullscreen();
				} else {
					document.documentElement.webkitRequestFullScreen();
				}
			} else {
				//ie
				// noinspection JSUnresolvedVariable
				if (document.documentElement.msRequestFullscreen) {
					// noinspection JSUnresolvedVariable
					if (document.msFullScreenElement) {
						// noinspection JSUnresolvedFunction
						document.msExitFullscreen();
					} else {
						document.documentElement.msRequestFullscreen();
					}
				}
			}
		}
	}
}