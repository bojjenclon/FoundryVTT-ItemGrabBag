export const registerSettings = function () {
	game.settings.register('item-grab-bag', 'bag-contents', {
		scope: 'world',
		config: false,
		type: Object,
		default: []
	});

	game.settings.register('item-grab-bag', 'folder-id', {
		scope: 'world',
		config: false,
		type: String,
		default: null
	});
}
