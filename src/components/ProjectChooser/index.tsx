import ProjectGallery, {type GalleryProject} from '@site/src/components/ProjectGallery';

/**
 * Backwards-compatible entry point for the docs projects page
 * (docs/projects/index.mdx + its translated siblings): the whole browser
 * lives in <ProjectGallery> now, so this is just an alias. The extra
 * indirection is kept so the four MDX files don't each need touching.
 */
export interface ProjectInfo extends GalleryProject {}

interface Props {
  projects: ProjectInfo[];
}

export default function ProjectChooser({projects}: Props): React.JSX.Element {
  return <ProjectGallery projects={projects} />;
}
