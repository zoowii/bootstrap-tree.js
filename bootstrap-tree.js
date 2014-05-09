(function ($) {
    /**
     * requirements: jQuery.js, underscore.js, Backbone.js, bootstrap 3
     * @param generator
     * @param context
     * @constructor
     */
        // TODO: use Promise class to beautify async code
    function Promise(generator, context) {
        if (context === undefined) {
            context = this;
        }
        this.isExecuting = false;
        this.isExecuted = false;
        this.data = null;
        this.generator = generator;
        this.context = context;
        this.callbacks = [];
    }

    Promise.prototype.get = function (callback) {
        if (this.isExecuted) {
            callback(this.data);
            return;
        }
        this.callbacks.push(callback);
        if (this.isExecuting) {
            return;
        }
        this.isExecuting = true;
        var _this = this;
        this.generator.call(this.context, function (res) {
            _this.isExecuted = true;
            _this.isExecuting = false;
            _this.data = res;
            while (_this.callbacks.length > 0) {
                var cb = _this.callbacks.shift();
                cb.call(_this.context, _this.data);
            }
        });
    };
    var emptyFunction = function () {
    };
    var BaseView = Backbone.View.extend({
        render: function () {
            this.$el.html(this.template(this.model instanceof Backbone.Model ? {data: this.model} : this.model));
            if (_.isFunction(this.afterRender)) {
                this.afterRender();
            }
            return this;
        }
    });
    var TreeNodeModel = Backbone.Model.extend({
        isLeaf: function () {
            return this.get('is_leaf');
        },
        getDisplayText: function () {
            return this.get('displayText') || this.get('text') || this.get('name');
        },
        isAvailable: function () {
            return this.get('available');
        },
        onClick: function () {
            return this.get('onClick') || emptyFunction;
        },
        onClickNotLeaf: function () {
            // call on click tree node which is not leaf
            return this.get('onClickNotLeaf') || emptyFunction;
        },
        isOpened: function () {
            return this.get('open-state') === 'open';
        },
        setOpened: function () {
            this.set('open-state', 'open');
        },
        setClosed: function () {
            this.set('open-state', 'close');
        },
        getExtraButtonText: function () {
            if (this.get('button')) {
                return this.get('button').text || "Go";
            } else {
                return null;
            }
        },
        getExtraButtonInfo: function () {
            var btnInfo = this.get('button');
            if (!btnInfo) {
                return btnInfo;
            }
            btnInfo = _.extend({
                click: emptyFunction,
                text: 'Go',
                extraClass: ''
            }, btnInfo);
            return btnInfo;
        }
    });
    var TreeNodeView = BaseView.extend({
        tagName: 'li',
        className: 'bootstrap-tree-li',
        template: _.template(''),
        events: {
            'click a:first': 'onClick',
            'click .tree-node-extra-btn:first': 'onClickExtraButton'
        },
        afterRender: function () {
            this.$el.html('');
            var $a = $('<a class="not-leaf-tree-node" href="#"></a>');
            // TODO: 可以通过参数定制图标
            if (this.model.isLeaf()) {
                var $icon = $("<span class='glyphicon glyphicon-file'></span>");
                $a.append($icon);
            } else {
                var $icon = $("<span class='glyphicon'></span>");
                if (this.model.isOpened()) {
                    $icon.addClass('glyphicon-folder-open');
                } else {
                    $icon.addClass('glyphicon-folder-close');
                }
                $a.append($icon);
            }
            var $text = $("<span>" + this.model.getDisplayText() + "</span>");
            $a.append($("<span>&nbsp;</span>"));
            $a.append($text);
            this.$el.append($a);
            var buttonText = this.model.getExtraButtonText();
            if (buttonText) {
                var $btn = $("<button class='btn btn-xs btn-primary tree-node-extra-btn'></button>");
                $btn.css({
                    'position': 'absolute',
                    'right': 0,
                    'margin-top': '-25px'
                });
                $btn.text(buttonText);
                this.$el.append($btn);
            }
        },
        closeTree: function () {
            this.model.setClosed();
            this.render();
        },
        openTree: function () {
            this.model.setOpened();
            this.render();
            this.trigger('to-change-current-tree-node', this);
        },
        onClick: function () {
            console.log('click');
            if (this.model.isAvailable()) {
                if (this.model.isLeaf()) {
                    this.model.onClick()(this, this.model, emptyFunction);
                } else {
                    this.model.onClickNotLeaf()(this, this.model, emptyFunction);
                    if (this.model.isOpened()) {
                        this.closeTree();
                    } else {
                        this.openTree();
                    }
                }
            }
        },
        onClickExtraButton: function () {
            var btnInfo = this.model.getExtraButtonInfo();
            if (this.model.isAvailable()) {
                btnInfo.click(this, this.model, emptyFunction);
            }
        }
    });
    $.fn.extend({
        tree: function (options) {
            options = $.extend({
                onClickNode: function (view, model, callback) {
                },
                onLoadTree: function (parent, callback) {
                },
                onLoadedTree: function (parent, callbak) {
                },
                onClickNotLeafNode: function (view, model, callback) {
                },
                context: null,
                button: null
            }, options);
            var $tree = $(this);
            $tree.html('');
            var openLocked = false;
            var currentTree = $tree;
            var currentTreeData = null;

            function loadNodesInCurrentTreeNode(content, callback) {
                var $ul = $('<ul class="nav nav-list tree"></ul>');
                _.each(content, function (item) {
                    var model = new TreeNodeModel(_.extend({
                        onClick: _.bind(options.onClickNode, options.context),
                        onClickNotLeaf: _.bind(options.onClickNotLeafNode, options.context),
                        button: options.button
                    }, item));
                    var view = new TreeNodeView({model: model});
                    view.on('to-change-current-tree-node', function (v) {
                        currentTree = v.$el;
                        currentTreeData = v.model;
                        requestToLoadNodesInCurrentTreeNode(null);
                    });
                    $ul.append(view.render().el);
                });
                $(currentTree).append($ul);
                options.onLoadedTree.call(options.context, currentTreeData, callback);
            }

            function requestToLoadNodesInCurrentTreeNode(callback) {
                if (openLocked) {
                    return;
                }
                openLocked = true;
                options.onLoadTree(currentTreeData, function (nodesData) {
                    loadNodesInCurrentTreeNode(nodesData, callback);
                    openLocked = false;
                });

            }

            requestToLoadNodesInCurrentTreeNode(null);
        }
    });
})(jQuery);
