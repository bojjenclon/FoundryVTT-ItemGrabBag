export default class GrabBagWindow extends Application {
  static get defaultOptions(): ApplicationOptions {
		return mergeObject(super.defaultOptions, {
      template: 'modules/item-grab-bag/templates/grab-bag-window.html',
      
      id: 'item-grab-bag-window',
      classes: ['item-grab-bag', 'bag-window'],
      title: 'Item Grab Bag',

      width: 300,
      height: 450,
			minimizable: true,
			resizable: true
		});
  }
  
  getData() {
    const data = {
      items: game.grabbag.items
    };

    return data;
  }
}
