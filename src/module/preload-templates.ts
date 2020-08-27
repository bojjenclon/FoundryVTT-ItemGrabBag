export const preloadTemplates = async function() {
	const templatePaths = [
		'modules/item-grab-bag/templates/grab-bag-window.html'
	];

	return loadTemplates(templatePaths);
}
