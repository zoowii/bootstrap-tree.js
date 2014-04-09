$(function() {
	var $tree1 = $("#tree1");
	function generateRandomString(n) {
		var  source = "0123456789qwertyuioplkjhgfdsazxcvbnm";
  		var  result = "";
  		for(var i=0;i<n;i++)  {
  			result += source.charAt(Math.ceil(Math.random()*100000000) % source.length);
  		}
  		return  result;
	}
	function generateArrayOfRandomString(count, len) {
		var result = [];
		for(var i=0;i<count;++i) {
			result.push(generateRandomString(len));
		}
		return result;
	}
	/**
	 * posibility是为true的可能
	 */
	function randomBoolean(posibility) {
		var max = 100000000;
		var val = Math.ceil(Math.random()*max);
		return val < posibility * max;
	}
	$tree1.tree({
		onLoadTree: function(parent, ret) {
			var items = generateArrayOfRandomString(8, 10);
			var data = _.map(items, function(item) {
				return {
				 available: true  // 如果这个节点不可用（不可点击），则这里返回false
				, is_leaf: randomBoolean(0.7)      // 是否是叶子节点
				, name: item
				};
			});
			ret(data);
		},
		onClickNode: function(view, model, ret) {
			alert('You clicked node ' + model.get('name'));
		}
	});
});