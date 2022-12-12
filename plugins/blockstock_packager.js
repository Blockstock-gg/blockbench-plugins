(function () {
  const path = require('path');
  
  var DEBUG_MODE = true;
  var btn_submenu;
  var btn_package_1;
  var btn_package_2;
  var preview;
  var img_data = [];
  var home_path = require('os').homedir();
  var config = {
    plugin_version: '0.0.2',
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
    version: config.plugin_version,
    variant: 'desktop',
    about: "This plugin packages Minecraft Bedrock model into a folder that can be quickly uploaded to Blockstock as a vendor.",
    tags: ["Minecraft: Bedrock Edition"],
    onload() {
      btn_package_1 = new Action('package_other_blockstock', {
        name: 'Package Other Model',
        description: 'Package',
        icon: 'fa-box',
        click: function () {
          MainDialog().show()
        }
      });
      btn_package_2 = new Action('package_current_blockstock', {
        name: 'Package Current Model',
        description: 'Package',
        icon: 'fa-box',
        click: function () {
          PackageCurrentDialog().show()
        }
      });
      btn_submenu = new Action('open_blockstock_menu', {
        children: [btn_package_2],
        name: 'Blockstock',
        description: 'Menu',
        icon: 'fa-box'
      });
      MenuBar.addAction(btn_submenu, 'filter');
    },
    onunload() {
      btn_package_1.delete()
      btn_package_2.delete()
      btn_submenu.delete()
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
            extensions:['json']
        },
        texture:{
            label: 'Model texture',
            type: 'file',
            extensions:['png']
        },
        animations:{
            label: '[Optional] Model animations',
            type: 'file',
            extensions:['json']
        },
        name: {
          label: 'Name',
          type: 'text',
          placeholder: 'Model name'
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
        if (validateInput(formData,'other')){
          this.hide();
          await loadModel(formData)
          const BBox = getBoundingBox()
          await captureScreenshot(formData, BBox);
          await writeFiles(formData)
          Blockbench.notification('Blockstock Exporter', 'Finished packaging');
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

  function PackageCurrentDialog() {
    preview = Preview.selected;
    var dialog = new Dialog({
      id: 'blockstock_exporter_current',
      title: 'Blockstock', 
      form: {
        export_path: {
            label: 'Export Path',
            type: 'folder',
            value: config.export_path
        },
        name: {
          label: 'Name',
          type: 'text',
          placeholder: 'Model name',
        },
        price: {
          label: 'Price (EUR)',
          type: 'number',
          min: 1,
          value: 1
        },
        include_animations: {
          label: 'Include animations',
          type: 'checkbox'
        },
        price_anim: {
          label: '[Optional] Animation price (EUR)',
          type: 'number',
          min: 0,
          value: 0,
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
        if (Project == 0) {
          Blockbench.showQuickMessage("No open project"); 
          return;
        }
        if (Project.textures.length == 0) {
          Blockbench.showQuickMessage("No Texture"); 
          return;
        }
        if (Cube.all.length == 0) {
          Blockbench.showQuickMessage("No Cubes");
          return;
        }
        if (validateInput(formData, 'current')){
          if (Project.selected_texture === null || Project.selected_texture === undefined) Project.textures[0].select()
          const BBox = getBoundingBox()
          await captureScreenshot(formData, BBox);
          await writeFiles(formData);
          Blockbench.notification('Blockstock Exporter', 'Finished packaging');
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

      const maxValue = (...array) => {
        let arr = [].concat(...array)
        // array.forEach(element => {
        //   if (element > max) max = element;
        // });
        return arr.reduce((max, val) => Math.abs(val) > max ? max = Math.abs(val) : max)
      }

      let targetPos = [(BBox.minXYZ[0] + BBox.maxXYZ[0]) / 2, (BBox.minXYZ[1] + BBox.maxXYZ[1]) / 2, (BBox.minXYZ[2] + BBox.maxXYZ[2]) / 2];
      let targetPos2 = getCenterPoint();
      let distMultiplier = 1.4;
      let cameraAxisDist = maxValue(BBox.maxXYZ, BBox.minXYZ) * distMultiplier;
      let cameraHeight = (BBox.minXYZ[1] + BBox.maxXYZ[1]) / 2 + cameraAxisDist;
      console.log(cameraAxisDist);

      if (DEBUG_MODE) console.log(`Camera target pos: ${targetPos}`);

      let camera_pos = [
        [-cameraAxisDist, cameraAxisDist, -cameraAxisDist], 
        [cameraAxisDist, cameraAxisDist, -cameraAxisDist], 
        [cameraAxisDist, cameraAxisDist, cameraAxisDist], 
        [-cameraAxisDist, cameraAxisDist, cameraAxisDist],
      ];

      let options = {
        crop: false,
        width: config.width,
        height: config.height
      };

      let tex_num = 0;
      let pos_num = 1;
      for (const tex of Project.textures) {
        tex.select();
        pos_num = 1;
        for (const pos of camera_pos) {

          let preset = {
            name: 'blockstock_packager',
            id: `blockstock_packager_${pos_num}`,
            projection: 'perspective',
            position: pos,
            target: targetPos,
            zoom: 0.1
          };

          Preview.selected.loadAnglePreset(preset);

          const img = await takeScreenshot(options).catch(console.error);
          let base64Image = img.split(';base64,').pop();
          if (tex_num === 0) img_data.push({num: `${pos_num}` , data: base64Image});
          else img_data.push({num: `${pos_num}_${tex_num}` , data: base64Image});
          pos_num++;
        }
        tex_num++;
      }
      if (DEBUG_MODE) console.log('end: captureScreenshot');
      return resolve()
    });

  }

  function writeFiles(formData) {
    return new Promise( async (resolve, reject) => {
      if (DEBUG_MODE) console.log('start: writeFiles');

      let base_asset_path = path.join(formData.export_path, formData.name)
      let previews_asset_path = path.join(base_asset_path)
      let model_asset_path = path.join(base_asset_path)
      let texture_asset_path = path.join(base_asset_path)
      let animation_asset_path = path.join(base_asset_path)

      let lowerCaseName = formData.name.toLowerCase();

      fs.mkdirSync(previews_asset_path, { recursive: true }, (err) => {
        if (err) console.error(err);
      });

      let asset = {
        plugin_version: config.plugin_version,
        name: formData.name,
        price: formData.price,
        price_anim: formData.price_anim,
        mc_type: 'Bedrock',
        local_anim_path: '',
        local_model_path: '',
        local_texture_paths: [],
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
      for (const img of img_data) {

        let full_preview_path = path.join(previews_asset_path, ("preview_img" + img.num + ".webp"))

        fs.writeFileSync(full_preview_path, img.data, { encoding: 'base64' }, (err) => {
          if (err) console.error(err);
        });
        asset.local_preview_paths.push(path.relative(base_asset_path,full_preview_path))
        if (DEBUG_MODE) console.log("Written " + full_preview_path);

      }

      img_data = [];

      // Write model file 
      fs.writeFileSync(path.join(model_asset_path, (lowerCaseName + ".geo.json")) , Project.format.codec.compile(), {}, (err) => {
        if (err) console.error(err);
      });
      asset.local_model_path = (lowerCaseName + ".geo.json")
      if (DEBUG_MODE) console.log("Written " + path.join(model_asset_path, (lowerCaseName + ".geo.json")));

      // Write texture files
      let tex_num = '';
      Project.textures.length > 1 ? tex_num = 0 : tex_num = '';
      for (const tex of Project.textures) {
        fs.writeFileSync(path.join(texture_asset_path, (lowerCaseName + tex_num + ".png")) , tex.getBase64(), { encoding: 'base64' }, (err) => {
          if (err) console.error(err);
        });
        
        asset.local_texture_paths.push((lowerCaseName + tex_num + ".png"))
        if (tex_num !== '') tex_num += 1;
        if (DEBUG_MODE) console.log("Written " + path.join(texture_asset_path, (lowerCaseName + ".png")) );
      }

      // Copy over animation file
      if(fs.existsSync(formData.animations)){
        fs.copyFile(formData.animations, path.join(animation_asset_path, (lowerCaseName + ".animation.json")), (err) => {
          if (err) console.error(err);
        });
  
        asset.local_anim_path = (lowerCaseName + ".animation.json")
        if (DEBUG_MODE) console.log("Written " + path.join(texture_asset_path, (lowerCaseName + ".animation.json")) );
      }

      // Write animation file 
      if(Project.animations.length != 0 && formData.include_animations) {
        let keys = [];
        let animations = Animation.all.slice()
        if (Format.animation_files) animations.sort((a1, a2) => a1.path.hashCode() - a2.path.hashCode())
        animations.forEach(animation => {
          keys.push(animation.name);
        })
        let content = Animator.buildFile(null, keys)

        fs.writeFileSync(path.join(model_asset_path, (lowerCaseName + ".animation.json")) , autoStringify(content), {}, (err) => {
          if (err) console.error(err);
        });
        asset.local_anim_path = (lowerCaseName + ".animation.json")
        if (DEBUG_MODE) console.log("Written " + path.join(model_asset_path, (lowerCaseName + ".animation.json")));
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
      if (Project.selected_texture === null || Project.selected_texture === undefined) Project.textures[0].select()
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
    let cubeCount = 0;
    if (DEBUG_MODE) console.log(Cube.all[0]);
    for (const cube of Cube.all) {
      if (!cube.visibility) continue;
      cubeCount++;
      // cube.select();
      // console.log(cube.from);
      // console.log(cube.to);
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

  function getCenterPoint() {
    let fromXYZ = [0, 0, 0];
    let toXYZ = [0, 0, 0];
    let centerXYZ = [0, 0, 0];
    let cubeCount = 0;
    if (DEBUG_MODE) console.log(Cube.all[0]);
    for (const cube of Cube.all) {
      if (!cube.visibility) continue;
      cubeCount++;
      fromXYZ[0] += cube.from[0];
      fromXYZ[1] += cube.from[1];
      fromXYZ[2] += cube.from[2];
      
      toXYZ[0] += cube.to[0];
      toXYZ[1] += cube.to[1];
      toXYZ[2] += cube.to[2];
    }
    
    fromXYZ = fromXYZ.map(i => i / cubeCount);
    toXYZ = toXYZ.map(i => i / cubeCount);

    centerXYZ = [(toXYZ[0] - fromXYZ[0]) / 2, (toXYZ[1] - fromXYZ[1]) / 2, (toXYZ[2] - fromXYZ[2]) / 2];

    if (DEBUG_MODE) console.log(centerXYZ);

    return centerXYZ
  }

  function validateInput(formData, packageType) {
    if (packageType === 'other') {
      if (!fs.existsSync(formData.model)){
        return false
      }
      if (!fs.existsSync(formData.texture)){
        return false
      }
    }
    if (typeof formData.name === 'underfined' || formData.name === ""){
      return false
    }
    if (!formData.tag_animals && !formData.tag_vehicles && !formData.tag_creatures && !formData.tag_electronics && !formData.tag_food && !formData.tag_furniture && !formData.tag_nature && !formData.tag_people && !formData.tag_items && !formData.tag_decoration) {
      return false
    }
    return true
  }
})();