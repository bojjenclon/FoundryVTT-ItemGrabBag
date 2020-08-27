export const registerSettings = function() {
	game.settings.register('item-grab-bag', 'bag-contents', {
		scope: 'client',
		config: false,
		type: Object,
		default: []
	});
}
