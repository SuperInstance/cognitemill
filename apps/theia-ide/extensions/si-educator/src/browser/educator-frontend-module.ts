/**
 * SuperInstance.AI Educator Dashboard - Frontend Module
 *
 * Provides comprehensive classroom management tools for educators including:
 * - Class overview and health monitoring
 * - Student progress tracking and analytics
 * - Intervention alerts and suggestions
 * - Automated assessment and feedback
 * - Live classroom monitoring
 * - Group management tools
 */

import { ContainerModule, Container } from 'inversify';
import { WidgetFactory } from '@theia/core/lib/browser/widget-manager';
import { FrontendApplicationContribution } from '@theia/core/lib/browser/frontend-application';
import { EducatorDashboardWidget } from './educator-dashboard-widget';
import { EducatorDashboardContribution } from './educator-dashboard-contribution';
import { ClassHealthWidget } from './components/class-health-widget';
import { StudentGridViewWidget } from './components/student-grid-view-widget';
import { InterventionAlertWidget } from './components/intervention-alert-widget';
import { AnalyticsWidget } from './components/analytics-widget';
import { EducatorDataService } from './educator-data-service';
import { EducatorApiService } from './educator-api-service';

export default new ContainerModule((bind: interfaces, unbind: interfaces.unbind) => {
    // Core Services
    bind(EducatorDataService).toSelf().inSingletonScope();
    bind(EducatorApiService).toSelf().inSingletonScope();

    // Widgets
    bind(EducatorDashboardWidget).toSelf();
    bind(ClassHealthWidget).toSelf();
    bind(StudentGridViewWidget).toSelf();
    bind(InterventionAlertWidget).toSelf();
    bind(AnalyticsWidget).toSelf();

    // Contributions
    bind(EducatorDashboardContribution).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(EducatorDashboardContribution);

    // Widget Factory
    bind(WidgetFactory).toDynamicValue(ctx => ({
        id: EducatorDashboardWidget.ID,
        createWidget: () => ctx.container.get<EducatorDashboardWidget>(EducatorDashboardWidget),
    })).inSingletonScope();

    // Styles
    bind(Style).toDynamicValue(ctx => {
        const styleElement = document.createElement('style');
        styleElement.textContent = require('./educator-styles.css').default;
        document.head.appendChild(styleElement);
        return {
            dispose: () => styleElement.remove()
        };
    }).inSingletonScope();
});

/**
 * Style interface for CSS injection
 */
interface Style {
    dispose(): void;
}
