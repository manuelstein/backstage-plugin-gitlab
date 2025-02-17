import { GitlabFillerProcessor } from './processor';
import { ConfigReader } from '@backstage/config';
import { Entity } from '@backstage/catalog-model';
import {
    GITLAB_PROJECT_SLUG,
    GITLAB_PROJECT_ID,
    GITLAB_INSTANCE,
} from '../annotations';

// To write tests
describe('Processor', () => {
    const config = new ConfigReader({
        integrations: {
            gitlab: [
                {
                    host: 'my.custom-gitlab.com',
                    apiBaseUrl: 'https://my.custom-gitlab.com/api/v4',
                },
                {
                    host: 'my.second-custom-gitlab.com',
                    apiBaseUrl: 'https://my.second-custom-gitlab.com/api/v4',
                },
            ],
        },
    });

    it('Processor has the correct name', () => {
        const processor = new GitlabFillerProcessor(config);
        expect(processor.getProcessorName()).toEqual('GitlabFillerProcessor');
    });

    it('Processor creates the right annotation', async () => {
        const processor = new GitlabFillerProcessor(config);
        const entity: Entity = {
            apiVersion: 'backstage.io/v1alpha1',
            kind: 'Component',
            metadata: {
                name: 'backstage',
            },
        };
        await processor.postProcessEntity(
            entity,
            {
                type: 'url',
                target: 'https://my.custom-gitlab.com/backstage/backstage/-/blob/next/catalog.yaml',
            },
            () => undefined
        );

        expect(entity.metadata?.annotations?.[GITLAB_PROJECT_SLUG]).toEqual(
            'backstage/backstage'
        );
        expect(entity.metadata?.annotations?.[GITLAB_INSTANCE]).toEqual('0');
    });

    it('Processor creates the right annotation for second instance', async () => {
        const processor = new GitlabFillerProcessor(config);
        const entity: Entity = {
            apiVersion: 'backstage.io/v1alpha1',
            kind: 'Component',
            metadata: {
                name: 'backstage',
            },
        };
        await processor.postProcessEntity(
            entity,
            {
                type: 'url',
                target: 'https://my.second-custom-gitlab.com/backstage/backstage/-/blob/next/catalog.yaml',
            },
            () => undefined
        );

        expect(entity.metadata?.annotations?.[GITLAB_PROJECT_SLUG]).toEqual(
            'backstage/backstage'
        );
        expect(entity.metadata?.annotations?.[GITLAB_INSTANCE]).toEqual('1');
    });

    it('Processor creates the right annotation for old gitlab instance', async () => {
        const processor = new GitlabFillerProcessor(config);
        const entity: Entity = {
            apiVersion: 'backstage.io/v1alpha1',
            kind: 'Component',
            metadata: {
                name: 'backstage',
            },
        };
        await processor.postProcessEntity(
            entity,
            {
                type: 'url',
                target: 'https://my.custom-gitlab.com/backstage/backstage/blob/next/catalog.yaml',
            },
            () => undefined
        );

        expect(entity.metadata?.annotations?.[GITLAB_PROJECT_SLUG]).toEqual(
            'backstage/backstage'
        );
        expect(entity.metadata?.annotations?.[GITLAB_INSTANCE]).toEqual('0');
    });

    it('The processor does not update GITLAB_PROJECT_SLUG if the annotations GITLAB_PROJECT_ID or GITLAB_PROJECT_SLUG exist', async () => {
        const processor = new GitlabFillerProcessor(config);
        const projectId = '3922';
        const entity: Entity = {
            apiVersion: 'backstage.io/v1alpha1',
            kind: 'Component',
            metadata: {
                name: 'backstage',
                annotations: {
                    [GITLAB_PROJECT_ID]: projectId,
                },
            },
        };
        await processor.postProcessEntity(
            entity,
            {
                type: 'url',
                target: 'https://my.custom-gitlab.com/backstage/backstage/blob/next/catalog.yaml',
            },
            () => undefined
        );

        expect(
            entity.metadata?.annotations?.[GITLAB_PROJECT_SLUG]
        ).toBeUndefined();
        expect(entity.metadata?.annotations?.[GITLAB_INSTANCE]).toEqual('0');

        expect(entity.metadata?.annotations?.[GITLAB_PROJECT_ID]).toEqual(
            projectId
        );
    });

    it('The processor does not update GITLAB_INSTANCE if the annotation exist', async () => {
        const processor = new GitlabFillerProcessor(config);
        const entity: Entity = {
            apiVersion: 'backstage.io/v1alpha1',
            kind: 'Component',
            metadata: {
                name: 'backstage',
                annotations: {
                    [GITLAB_INSTANCE]: '1',
                },
            },
        };
        await processor.postProcessEntity(
            entity,
            {
                type: 'url',
                target: 'https://my.custom-gitlab.com/backstage/backstage/blob/next/catalog.yaml',
            },
            () => undefined
        );

        expect(entity.metadata?.annotations?.[GITLAB_PROJECT_SLUG]).toEqual(
            'backstage/backstage'
        );
        expect(entity.metadata?.annotations?.[GITLAB_INSTANCE]).toEqual('1');

        expect(
            entity.metadata?.annotations?.[GITLAB_PROJECT_ID]
        ).toBeUndefined();
    });

    it('The processor does not update annotation if the location is not a gitlab instance', async () => {
        const processor = new GitlabFillerProcessor(config);
        const entity: Entity = {
            apiVersion: 'backstage.io/v1alpha1',
            kind: 'Component',
            metadata: {
                name: 'backstage',
            },
        };
        await processor.postProcessEntity(
            entity,
            {
                type: 'url',
                target: 'https://my.github-instance.com/backstage/backstage/blob/next/catalog.yaml',
            },
            () => undefined
        );

        expect(
            entity.metadata?.annotations?.[GITLAB_PROJECT_SLUG]
        ).toBeUndefined();
        expect(entity.metadata?.annotations?.[GITLAB_INSTANCE]).toBeUndefined();
        expect(
            entity.metadata?.annotations?.[GITLAB_PROJECT_ID]
        ).toBeUndefined();
    });
});
