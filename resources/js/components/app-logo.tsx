import AppLogoIcon from './app-logo-icon';

export default function AppLogo(props: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <>
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                <AppLogoIcon className="size-5 fill-current" />
            </div>
            <div className="ml-3 grid flex-1 text-left text-sm">
                <span className="truncate leading-tight font-semibold text-foreground">
                    OTA Development
                </span>
                <span className="truncate text-xs text-muted-foreground">
                    Business Solutions
                </span>
            </div>
        </>
    );
}
