/**
 * Images rendered on the Life dome gallery (/life).
 *
 * DomeGallery tile capacity = segments * 5.
 * With <DomeGallery segments={34} /> the grid has 170 tiles:
 *   - fewer than 170 entries here → the list is repeated to fill
 *     every tile (so a handful of photos still covers the dome).
 *   - more than 170 → the extras are silently dropped.
 *
 * Each entry is either a plain URL string or `{ src, alt }`.
 * `alt` is optional but recommended for accessibility.
 */

export interface LifeImage {
	src: string;
	alt?: string;
}

export const LIFE_IMAGES: LifeImage[] = [
	// TODO: drop your own image URLs here.
	// Examples — delete / replace freely:
	{ src: 'https://pub-c5d2e01f96db4a3aaa42d84e4642f3da.r2.dev/111111.png', alt: 'placeholder' },
	{ src: 'https://pub-c5d2e01f96db4a3aaa42d84e4642f3da.r2.dev/DSC_4995.JPG', alt: 'placeholder' },
	{ src: 'https://pub-c5d2e01f96db4a3aaa42d84e4642f3da.r2.dev/DSC_5102.JPG', alt: 'placeholder' },
	{ src: 'https://pub-c5d2e01f96db4a3aaa42d84e4642f3da.r2.dev/IMG_2779.png', alt: 'placeholder' },
	{ src: 'https://pub-c5d2e01f96db4a3aaa42d84e4642f3da.r2.dev/IMG_3004.png', alt: 'placeholder' },
	{ src: 'https://pub-c5d2e01f96db4a3aaa42d84e4642f3da.r2.dev/PSDSC_5220.png', alt: 'placeholder' },
	{ src: 'https://pub-c5d2e01f96db4a3aaa42d84e4642f3da.r2.dev/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20260421223556_50_939.jpg', alt: 'placeholder' },
	{ src: 'https://pub-c5d2e01f96db4a3aaa42d84e4642f3da.r2.dev/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20260421214525_19_939.jpg', alt: 'placeholder' },
	{ src: 'https://pub-c5d2e01f96db4a3aaa42d84e4642f3da.r2.dev/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20260421220241_20_939.jpg', alt: 'placeholder' },
	{ src: 'https://pub-c5d2e01f96db4a3aaa42d84e4642f3da.r2.dev/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20260421220249_21_939.jpg', alt: 'placeholder' },
	{ src: 'https://pub-c5d2e01f96db4a3aaa42d84e4642f3da.r2.dev/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20260421220300_22_939.jpg', alt: 'placeholder' },
	{ src: 'https://pub-c5d2e01f96db4a3aaa42d84e4642f3da.r2.dev/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20260421223050_23_939.jpg', alt: 'placeholder' },
	{ src: 'https://pub-c5d2e01f96db4a3aaa42d84e4642f3da.r2.dev/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20260421223053_24_939.jpg', alt: 'placeholder' },
	{ src: 'https://pub-c5d2e01f96db4a3aaa42d84e4642f3da.r2.dev/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20260421223618_53_939.jpg', alt: 'placeholder' },	
	{ src: 'https://pub-c5d2e01f96db4a3aaa42d84e4642f3da.r2.dev/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20260421223102_25_939.jpg', alt: 'placeholder' },
	{ src: 'https://pub-c5d2e01f96db4a3aaa42d84e4642f3da.r2.dev/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20260421223107_26_939.jpg', alt: 'placeholder' },
	{ src: 'https://pub-c5d2e01f96db4a3aaa42d84e4642f3da.r2.dev/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20260421223116_27_939.jpg', alt: 'placeholder' },
	{ src: 'https://pub-c5d2e01f96db4a3aaa42d84e4642f3da.r2.dev/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20260421223606_51_939.jpg', alt: 'placeholder' },	
	{ src: 'https://pub-c5d2e01f96db4a3aaa42d84e4642f3da.r2.dev/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20260421223136_28_939.jpg', alt: 'placeholder' },
	{ src: 'https://pub-c5d2e01f96db4a3aaa42d84e4642f3da.r2.dev/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20260421223151_29_939.jpg', alt: 'placeholder' },
	{ src: 'https://pub-c5d2e01f96db4a3aaa42d84e4642f3da.r2.dev/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20260421223154_30_939.jpg', alt: 'placeholder' },
	{ src: 'https://pub-c5d2e01f96db4a3aaa42d84e4642f3da.r2.dev/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20260421223201_31_939.jpg', alt: 'placeholder' },
	{ src: 'https://pub-c5d2e01f96db4a3aaa42d84e4642f3da.r2.dev/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20260421223209_32_939.jpg', alt: 'placeholder' },
	{ src: 'https://pub-c5d2e01f96db4a3aaa42d84e4642f3da.r2.dev/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20260421223217_33_939.jpg', alt: 'placeholder' },
	{ src: 'https://pub-c5d2e01f96db4a3aaa42d84e4642f3da.r2.dev/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20260421223550_49_939.jpg', alt: 'placeholder' },
	{ src: 'https://pub-c5d2e01f96db4a3aaa42d84e4642f3da.r2.dev/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20260421223234_35_939.jpg', alt: 'placeholder' },
	{ src: 'https://pub-c5d2e01f96db4a3aaa42d84e4642f3da.r2.dev/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20260421223239_36_939.jpg', alt: 'placeholder' },
	{ src: 'https://pub-c5d2e01f96db4a3aaa42d84e4642f3da.r2.dev/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20260421223243_37_939.jpg', alt: 'placeholder' },
	{ src: 'https://pub-c5d2e01f96db4a3aaa42d84e4642f3da.r2.dev/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20260421223306_38_939.jpg', alt: 'placeholder' },
	{ src: 'https://pub-c5d2e01f96db4a3aaa42d84e4642f3da.r2.dev/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20260421223319_39_939.jpg', alt: 'placeholder' },
	{ src: 'https://pub-c5d2e01f96db4a3aaa42d84e4642f3da.r2.dev/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20260421223333_40_939.jpg', alt: 'placeholder' },
	{ src: 'https://pub-c5d2e01f96db4a3aaa42d84e4642f3da.r2.dev/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20260421223338_41_939.jpg', alt: 'placeholder' },
	{ src: 'https://pub-c5d2e01f96db4a3aaa42d84e4642f3da.r2.dev/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20260421223409_42_939.jpg', alt: 'placeholder' },
	{ src: 'https://pub-c5d2e01f96db4a3aaa42d84e4642f3da.r2.dev/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20260421223623_54_939.jpg', alt: 'placeholder' },
	{ src: 'https://pub-c5d2e01f96db4a3aaa42d84e4642f3da.r2.dev/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20260421223442_44_939.jpg', alt: 'placeholder' },
	{ src: 'https://pub-c5d2e01f96db4a3aaa42d84e4642f3da.r2.dev/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20260421223503_45_939.jpg', alt: 'placeholder' },
	{ src: 'https://pub-c5d2e01f96db4a3aaa42d84e4642f3da.r2.dev/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20260421223538_46_939.jpg', alt: 'placeholder' },
	{ src: 'https://pub-c5d2e01f96db4a3aaa42d84e4642f3da.r2.dev/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20260421223543_47_939.jpg', alt: 'placeholder' },
	{ src: 'https://pub-c5d2e01f96db4a3aaa42d84e4642f3da.r2.dev/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20260421223548_48_939.jpg', alt: 'placeholder' },



	{ src: 'https://pub-c5d2e01f96db4a3aaa42d84e4642f3da.r2.dev/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20260421223611_52_939.jpg', alt: 'placeholder' },


	
];
