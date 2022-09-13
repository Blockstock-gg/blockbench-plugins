(function () {
  const path = require('path');
  
  var DEBUG_MODE = true;
  var debug_data = {
    model_path: 'C:/Users/Domas/AppData/Local/Packages/Microsoft.MinecraftUWP_8wekyb3d8bbwe/LocalState/games/com.mojang/minecraftWorlds/ZooTycoon/resource_packs/0/models/entity/elephant.geo.json',
    texture_path: 'C:/Users/Domas/AppData/Local/Packages/Microsoft.MinecraftUWP_8wekyb3d8bbwe/LocalState/games/com.mojang/minecraftWorlds/ZooTycoon/resource_packs/0/textures/entity/elephant.png',
    anim_path: 'C:/Users/Domas/AppData/Local/Packages/Microsoft.MinecraftUWP_8wekyb3d8bbwe/LocalState/games/com.mojang/minecraftWorlds/ZooTycoon/resource_packs/0/animations/elephant.animations.json',
    name: 'Elephant'    
  }

  var button;
  var preview;
  var img_data = [];
  var home_path = require('os').homedir();
  var config = {
    width: 1440,
    height: 1080,
    export_path: path.join(home_path, 'Downloads')
  };

  var progressObj = {
    value: 0,
    add(addition) {
      addition == 0 ? this.value = addition : this.value = this.value + addition;
      Blockbench.setProgress(this.value);
    }
  }

  Plugin.register('blockstock_packager', {
    title: 'Blockstock Packager',
    author: 'Blockstock',
    description: 'This plugin can package a model for Blockstock',
    icon: 'fa-box',
    version: '0.0.1',
    variant: 'desktop',
    about:
      "This plugin packages Minecraft Bedrock model into a folder that can be quickly uploaded to Blockstock as a vendor.",
    tags: ["Minecraft: Bedrock Edition"],
    onload() {
      button = new Action('package_blockstock', {
        name: 'Package for Blockstock',
        description: 'Package',
        icon: 'fa-box',
        click: function () {
          MainDialog().show()
        }
      });
      MenuBar.addAction(button, 'filter');
    },
    onunload() {
      button.delete();
    }
  });

  function MainDialog() {
    preview = Preview.selected;
    var dialog = new Dialog({
      id: 'blockstock_exporter_main',
      title: 'Blockstock', 
      form: {
        export_path: {
            label: 'Export Path',
            type: 'folder',
            value: config.export_path
        },
        model: {
            label: 'Model',
            type: 'file',
            extensions:['json'],
            value: debug_data.model_path
        },
        texture:{
            label: 'Model texture',
            type: 'file',
            extensions:['png'],
            value: debug_data.texture_path
        },
        animations:{
            label: '[Optional] Model animations',
            type: 'file',
            extensions:['json'],
            value: debug_data.anim_path
        },
        name: {
          label: 'Name',
          type: 'text',
          placeholder: 'test',
          value: debug_data.name
        },
        price: {
          label: 'Price (EUR)',
          type: 'number',
          min: 1,
          value: 1
        },
        price_anim: {
          label: '[Optional] Animation price (EUR)',
          type: 'number',
          min: 0,
          value: 0
        },
        tag_animals: {
          label: 'Animals',
          type: 'checkbox'
        },
        tag_vehicles: {
          label: 'Cars & Vehicles',
          type: 'checkbox'
        },
        tag_creatures: {
          label: 'Creatures',
          type: 'checkbox'
        },
        tag_electronics: {
          label: 'Electronics & Technology',
          type: 'checkbox'
        },
        tag_food: {
          label: 'Food & Drinks',
          type: 'checkbox'
        },
        tag_furniture: {
          label: 'Furniture',
          type: 'checkbox'
        },
        tag_nature: {
          label: 'Nature',
          type: 'checkbox'
        },
        tag_people: {
          label: 'People',
          type: 'checkbox'
        },
        tag_items: {
          label: 'Items',
          type: 'checkbox'
        },
        tag_decoration: {
          label: 'Decoration',
          type: 'checkbox'
        }
      },
      onConfirm: async function (formData) {
        // debugger;
        if (validateInput(formData)){
          this.hide();
          await loadModel(formData)
          progressObj.add(0.1)
          const BBox = getBoundingBox()
          await captureScreenshot(formData, BBox);
          await writeFiles(formData)
          progressObj.add(0.1)
          Blockbench.notification('Blockstock Exporter', 'Finished packaging');
          progressObj.add(0)
        } else {
          Blockbench.showQuickMessage("Invalid input data")
        }
      },
      onCancel: function (formData) {
        this.hide();
      }
    });
    return dialog;
  }

  function captureScreenshot(formData, BBox) {

    return new Promise( async (resolve, reject) => {
      if (DEBUG_MODE) console.log('start: captureScreenshot');

      let maxValue = array => {
        let max = 0;
        array.forEach(element => {
          if (element > max) max = element;
        });
        return max;
      }

      let targetPos = [(BBox.minXYZ[0] + BBox.maxXYZ[0]) / 2, (BBox.minXYZ[1] + BBox.maxXYZ[1]) / 2, (BBox.minXYZ[2] + BBox.maxXYZ[2]) / 2];
      let distBuffer = 15;
      let cameraAxisDist = maxValue(BBox.maxXYZ) + distBuffer

      let camera_pos = [
        [-cameraAxisDist, cameraAxisDist, -cameraAxisDist], 
        [cameraAxisDist, cameraAxisDist, -cameraAxisDist], 
        [cameraAxisDist, cameraAxisDist, cameraAxisDist], 
        [-cameraAxisDist, cameraAxisDist, cameraAxisDist],
      ];

      if (DEBUG_MODE) console.log(cameraAxisDist);

      for (const pos of camera_pos) {

        let preset = {
          name: 'test',
          id: "test_id",
          projection: 'perspective',
          position: pos,
          target: targetPos,
          zoom: 1
        };

        Preview.selected.loadAnglePreset(preset);

        let options = {
          crop: false,
          width: config.width,
          height: config.height
        };

        const takeScreenshot = async (options) => {
          return new Promise( (resolve, reject) => {
            preview.screenshot(options, (img) => {
              if (!img) {
                return reject('error while capturing screenshot');
              }
              resolve(img);
            });
          })
        }

        const img = await takeScreenshot(options).catch(console.error);
        let base64Image = img.split(';base64,').pop();
        img_data.push(base64Image);
        progressObj.add(0.2)
      }
      if (DEBUG_MODE) console.log('end: captureScreenshot');
      return resolve()
    });

  }

  function writeFiles(formData) {
    return new Promise( async (resolve, reject) => {
      if (DEBUG_MODE) console.log('start: writeFiles');

      let base_asset_path = path.join(config.export_path, formData.name)
      let previews_asset_path = path.join(base_asset_path)
      let model_asset_path = path.join(base_asset_path)
      let texture_asset_path = path.join(base_asset_path)
      let animation_asset_path = path.join(base_asset_path)

      let lowerCaseName = formData.name.toLowerCase();

      fs.mkdirSync(base_asset_path, { recursive: true }, (err) => {
        if (err) console.error(err);
      });

      let asset = {
        name: formData.name,
        price: formData.price,
        price_anim: formData.price_anim,
        type: 'Bedrock',
        local_anim_path: '',
        local_model_path: '',
        local_texture_path: '',
        local_preview_paths: [],
        tags: [],
      }

      if (formData.tag_animals) asset.tags.push('Animals');
      if (formData.tag_vehicles) asset.tags.push('Cars & Vehicles');
      if (formData.tag_creatures) asset.tags.push('Creatures');
      if (formData.tag_electronics) asset.tags.push('Electronics & Technology');
      if (formData.tag_food) asset.tags.push('Food & Drinks');
      if (formData.tag_furniture) asset.tags.push('Furniture');
      if (formData.tag_nature) asset.tags.push('Nature');
      if (formData.tag_people) asset.tags.push('People');
      if (formData.tag_items) asset.tags.push('Items');
      if (formData.tag_decoration) asset.tags.push('Decoration');



      // Write screenshot images
      let img_num = 0
      for (const img of img_data) {

        let num = img_num
        let full_preview_path = path.join(previews_asset_path, (lowerCaseName  + "_img" + num + ".webp"))

        fs.writeFileSync(full_preview_path, img, { encoding: 'base64' }, (err) => {
          if (err) console.error(err);
        });
        asset.local_preview_paths.push(path.basename(full_preview_path))
        if (DEBUG_MODE) console.log("Written " + full_preview_path);

        img_num++;
      }

      img_data = [];

      // Write model file 
      fs.writeFileSync(path.join(model_asset_path, (lowerCaseName + ".geo.json")) , this.model[0].content, {}, (err) => {
        if (err) console.error(err);
      });
      asset.local_model_path = (lowerCaseName + ".geo.json")
      if (DEBUG_MODE) console.log("Written " + path.join(model_asset_path, (lowerCaseName + ".geo.json")));

      // Write texture file 
      fs.writeFileSync(path.join(texture_asset_path, (lowerCaseName + ".png")) , this.texture.getBase64(), { encoding: 'base64' }, (err) => {
        if (err) console.error(err);
      });

      asset.local_texture_path = (lowerCaseName + ".png")
      if (DEBUG_MODE) console.log("Written " + path.join(texture_asset_path, (lowerCaseName + ".png")) );

      // Copy over animation file
      if(fs.existsSync(formData.animations)){
        fs.copyFile(formData.animations, path.join(animation_asset_path, (lowerCaseName + ".animation.json")), (err) => {
          if (err) console.error(err);
        });
  
        asset.local_anim_path = (lowerCaseName + ".animation.json")
        if (DEBUG_MODE) console.log("Written " + path.join(texture_asset_path, (lowerCaseName + ".animation.json")) );
      }

      // Write metadata
      let data = JSON.stringify(asset)
      fs.writeFileSync(path.join(base_asset_path, "metadata.json"), data, (err) => {
        if (err) console.error(err);
      });

      if (DEBUG_MODE) console.log('end: writeFiles');
      return resolve()
    });
  }

  function loadModel(formData) {
    return new Promise( async (resolve, reject) => {
      if (DEBUG_MODE) console.log('start: loadModel');
      const readModelAsync = async (modelPath) => {
        return new Promise( (resolve, reject) => {
          
          let options = {
            readtype: "text"
          };
          Blockbench.read(modelPath, options, function(files){
            if (!files) {
              return reject('error while reading model file');
            }
            resolve(files);
          });
        })
      }

      
      this.model = await readModelAsync(formData.model)
      
      if (DEBUG_MODE) console.log(this.model);
      loadModelFile(this.model[0]);

      this.texture = new Texture().fromPath(formData.texture).add(false).fillParticle();
      Canvas.updateLayeredTextures();
      if (DEBUG_MODE) console.log(this.texture);
      setTimeout(() => {
        if (DEBUG_MODE) console.log('end: loadModel');
        return resolve()
        
      }, 100);
    });
  }

  function getBoundingBox() {
    let minXYZ = [0, 0, 0];
    let maxXYZ = [0, 0, 0];
    for (const cube of Cube.all) {
      if (cube.from[0] < minXYZ[0]) minXYZ[0] = cube.from[0];
      if (cube.from[1] < minXYZ[1]) minXYZ[1] = cube.from[1];
      if (cube.from[2] < minXYZ[2]) minXYZ[2] = cube.from[2];

      if (cube.to[0] > maxXYZ[0]) maxXYZ[0] = cube.to[0];
      if (cube.to[1] > maxXYZ[1]) maxXYZ[1] = cube.to[1];
      if (cube.to[2] > maxXYZ[2]) maxXYZ[2] = cube.to[2];
    }

    if (DEBUG_MODE) console.log({minXYZ, maxXYZ});

    return {minXYZ, maxXYZ}
  }

  function validateInput(formData) {
    if (typeof formData.name === 'underfined' || formData.name === ""){
      return false
    }
    if (!fs.existsSync(formData.model)){
      return false
    }
    if (!fs.existsSync(formData.texture)){
      return false
    }
    if (!formData.tag_animals && !formData.tag_vehicles && !formData.tag_creatures && !formData.tag_electronics && !formData.tag_food && !formData.tag_furniture && !formData.tag_nature && !formData.tag_people && !formData.tag_items && !formData.tag_decoration) {
      return false
    }
    return true
  }
})();