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
            return this.get('onClick');
        },
        onDblClick: function () {
            return this.get('onDblClick');
        },
        isOpened: function () {
            return this.get('open-state') === 'open';
        },
        setOpened: function () {
            this.set('open-state', 'open');
        },
        setClosed: function () {
            this.set('open-state', 'close');
        }
    });
    var TreeNodeView = BaseView.extend({
        tagName: 'li',
        className: 'bootstrap-tree-li',
        template: _.template(''),
        events: {
            'click a:first': 'onClick',
            'dblclick a:first': 'onDblClick'
        },
        afterRender: function () {
            this.$el.html('');
            var $a = $('<a href="#"></a>');
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
        },
        closeTree: function () {
            this.model.setClosed();
            this.render();
        },
        openTree: function() {
            this.model.setOpened();
            this.render();
            this.trigger('to-change-current-tree-node', this);
        },
        onClick: function () {
            console.log('click');
            if (this.model.isAvailable()) {
                if (this.model.isLeaf()) {
                    this.model.onClick()(this, this.model, function () {

                    });
                } else {
                    if (this.model.isOpened()) {
                        this.closeTree();
                    } else {
                        this.openTree();
                    }
                }
            }
        },
        onDblClick: function () {
            console.log('dbl click');
            if (this.model.isAvailable()) {
                if (this.model.isLeaf()) {
                    this.model.onDblClick()(this, this.model, function () {

                    });
                } else {
                    if (this.model.isOpened()) {
                        this.closeTree();
                    } else {
                        this.openTree();
                    }
                }
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
                onDblClickNode: function (view, model, callback) {
                },
                context: null
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
                        onDblClick: _.bind(options.onDblClickNode, options.context)
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
